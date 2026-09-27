/**
 * Adds an Ecuador region priced in USD and makes USD the store's default
 * currency. EUR stays as a secondary currency for the existing Europe region.
 *
 *   pnpm medusa exec ./src/scripts/add-ec-region.ts
 *
 * Idempotent: every step checks what already exists before creating anything,
 * so re-running it is a no-op.
 */
import {
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

const COUNTRY_CODE = "ec"
const CURRENCY_CODE = "usd"
const REGION_NAME = "Ecuador"
const SERVICE_ZONE_NAME = "Ecuador"
const SHIPPING_OPTION_NAME = "Standard Shipping"
const SHIPPING_PRICE = 10

export default async function addEcRegion({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

  // ---- Region -------------------------------------------------------------

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })

  const existingRegion = regions.find((candidate) =>
    candidate.countries?.some((country) => country?.iso_2 === COUNTRY_CODE)
  )
  let regionId: string

  if (existingRegion) {
    regionId = existingRegion.id
    logger.info(
      `Region "${existingRegion.name}" (${existingRegion.currency_code}) already covers "${COUNTRY_CODE}". Skipping.`
    )
  } else {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: CURRENCY_CODE,
            countries: [COUNTRY_CODE],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
    regionId = result[0].id
    logger.info(`Created region "${REGION_NAME}" in ${CURRENCY_CODE}.`)
  }

  // ---- Tax region ---------------------------------------------------------

  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id"],
    filters: { country_code: COUNTRY_CODE },
  })

  if (taxRegions.length) {
    logger.info(`Tax region for "${COUNTRY_CODE}" already exists. Skipping.`)
  } else {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: COUNTRY_CODE, provider_id: "tp_system" }],
    })
    logger.info(`Created tax region for "${COUNTRY_CODE}".`)
  }

  // ---- Store default currency ---------------------------------------------

  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "supported_currencies.currency_code",
      "supported_currencies.is_default",
    ],
  })
  const store = stores[0]

  if (!store) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No store found. Run the initial data seed first."
    )
  }

  const currentCurrencies = (store.supported_currencies ?? []).filter(
    (currency): currency is NonNullable<typeof currency> => Boolean(currency)
  )
  const usdIsDefault = currentCurrencies.some(
    (currency) => currency.currency_code === CURRENCY_CODE && currency.is_default
  )

  if (usdIsDefault) {
    logger.info(`"${CURRENCY_CODE}" is already the store's default currency. Skipping.`)
  } else {
    const supportedCurrencies = currentCurrencies
      .filter((currency) => currency.currency_code !== CURRENCY_CODE)
      .map((currency) => ({
        currency_code: currency.currency_code,
        is_default: false,
      }))

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: [
            { currency_code: CURRENCY_CODE, is_default: true },
            ...supportedCurrencies,
          ],
        },
      },
    })
    logger.info(`Set "${CURRENCY_CODE}" as the store's default currency.`)
  }

  // ---- Service zone -------------------------------------------------------

  // Attach Ecuador to the fulfillment set of the existing warehouse, so the
  // stock location and sales channel links from the initial seed apply.
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "fulfillment_sets.id", "fulfillment_sets.type"],
  })
  const fulfillmentSetId = stockLocations
    .flatMap((location) => location.fulfillment_sets ?? [])
    .find((set) => set?.type === "shipping")?.id

  if (!fulfillmentSetId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No shipping fulfillment set linked to a stock location. Run the initial data seed first."
    )
  }

  const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets(
    { type: "shipping" },
    { relations: ["service_zones", "service_zones.geo_zones"] }
  )

  let serviceZone = fulfillmentSets
    .flatMap((set) => set.service_zones ?? [])
    .find((zone) =>
      zone.geo_zones?.some((geoZone) => geoZone.country_code === COUNTRY_CODE)
    )

  if (serviceZone) {
    logger.info(`Service zone "${serviceZone.name}" already covers "${COUNTRY_CODE}". Skipping.`)
  } else {
    serviceZone = await fulfillmentModuleService.createServiceZones({
      name: SERVICE_ZONE_NAME,
      fulfillment_set_id: fulfillmentSetId,
      geo_zones: [{ type: "country", country_code: COUNTRY_CODE }],
    })
    logger.info(`Created service zone "${SERVICE_ZONE_NAME}".`)
  }

  // ---- Shipping option ----------------------------------------------------

  const existingOptions = await fulfillmentModuleService.listShippingOptions({
    service_zone: { id: serviceZone.id },
    name: SHIPPING_OPTION_NAME,
  })

  if (existingOptions.length) {
    logger.info(
      `Shipping option "${SHIPPING_OPTION_NAME}" already exists for "${serviceZone.name}". Skipping.`
    )
  } else {
    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    })
    const shippingProfile = shippingProfiles[0]

    if (!shippingProfile) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "No shipping profile found. Run the initial data seed first."
      )
    }

    // Reuse the "standard" type the initial seed created, if present.
    const [standardType] = await fulfillmentModuleService.listShippingOptionTypes({
      code: "standard",
    })

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: SHIPPING_OPTION_NAME,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZone.id,
          shipping_profile_id: shippingProfile.id,
          ...(standardType
            ? { type_id: standardType.id }
            : {
                type: {
                  label: "Standard",
                  description: "Ship in 2-3 days.",
                  code: "standard",
                },
              }),
          prices: [
            { currency_code: CURRENCY_CODE, amount: SHIPPING_PRICE },
            { region_id: regionId, amount: SHIPPING_PRICE },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
    logger.info(
      `Created shipping option "${SHIPPING_OPTION_NAME}" at ${SHIPPING_PRICE} ${CURRENCY_CODE.toUpperCase()}.`
    )
  }

  logger.info("Done. Ecuador region is ready.")
}
