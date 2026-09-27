/**
 * Completes the "Cafe de loja" product created in the Admin: shipping profile,
 * image, SKU and managed inventory with stock at the existing warehouse.
 * Without a shipping profile, checkout fails with "The cart items require
 * shipping profiles that are not satisfied by the current shipping methods".
 *
 *   pnpm medusa exec ./src/scripts/complete-cafe-de-loja.ts
 *
 * Idempotent: each field is only set when missing.
 */
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  updateProductVariantsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

const HANDLE = "cafe-de-loja"
const SKU = "CAFE-LOJA"
const IMAGE_URL =
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/coffee-mug.png"
const STOCKED_QUANTITY = 100

export default async function completeCafeDeLoja({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "thumbnail",
      "shipping_profile.id",
      "images.id",
      "variants.id",
      "variants.sku",
      "variants.title",
      "variants.manage_inventory",
    ],
    filters: { handle: HANDLE },
  })
  const product = products[0]

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product "${HANDLE}" not found. Create it in the Admin first.`
    )
  }

  // ---- Shipping profile -------------------------------------------------

  if (product.shipping_profile?.id) {
    logger.info("Product already has a shipping profile. Skipping.")
  } else {
    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id", "name"],
      filters: { type: "default" },
    })
    const shippingProfile = shippingProfiles[0]

    if (!shippingProfile) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "No default shipping profile found. Run the initial data seed first."
      )
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: { shipping_profile_id: shippingProfile.id },
      },
    })
    logger.info(`Assigned shipping profile "${shippingProfile.name}".`)
  }

  // ---- Image --------------------------------------------------------------

  if (product.thumbnail && product.images?.length) {
    logger.info("Product already has an image. Skipping.")
  } else {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: { thumbnail: IMAGE_URL, images: [{ url: IMAGE_URL }] },
      },
    })
    logger.info("Set product image.")
  }

  // ---- Stock location -----------------------------------------------------

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const stockLocation = stockLocations[0]

  if (!stockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No stock location found. Run the initial data seed first."
    )
  }

  // ---- Variants: SKU and inventory ----------------------------------------

  const variants = (product.variants ?? []).filter(
    (variant): variant is NonNullable<typeof variant> => Boolean(variant)
  )

  for (const [index, variant] of variants.entries()) {
    const sku =
      variant.sku || (variants.length > 1 ? `${SKU}-${index + 1}` : SKU)

    if (variant.sku && variant.manage_inventory) {
      logger.info(`Variant "${variant.title}" already has SKU and inventory. Skipping update.`)
    } else {
      await updateProductVariantsWorkflow(container).run({
        input: {
          selector: { id: variant.id },
          update: { sku, manage_inventory: true },
        },
      })
      logger.info(`Variant "${variant.title}": sku=${sku}, manage_inventory=true.`)
    }

    // Re-read: enabling manage_inventory may already create and link an item.
    const { data: inventoryLinks } = await query.graph({
      entity: "product_variant",
      fields: ["inventory_items.inventory_item_id"],
      filters: { id: variant.id },
    })
    let inventoryItemId =
      inventoryLinks[0]?.inventory_items?.[0]?.inventory_item_id

    if (!inventoryItemId) {
      const { result } = await createInventoryItemsWorkflow(container).run({
        input: { items: [{ sku, title: variant.title ?? sku }] },
      })
      inventoryItemId = result[0].id

      await link.create({
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
      })
      logger.info(`Created and linked inventory item for "${variant.title}".`)
    }

    const { data: levels } = await query.graph({
      entity: "inventory_level",
      fields: ["id"],
      filters: {
        inventory_item_id: inventoryItemId,
        location_id: stockLocation.id,
      },
    })

    if (levels.length) {
      logger.info(`Stock at "${stockLocation.name}" already exists. Skipping.`)
    } else {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [
            {
              inventory_item_id: inventoryItemId,
              location_id: stockLocation.id,
              stocked_quantity: STOCKED_QUANTITY,
            },
          ],
        },
      })
      logger.info(`Stocked ${STOCKED_QUANTITY} units at "${stockLocation.name}".`)
    }
  }

  logger.info(`Done. "${HANDLE}" is fully configured.`)
}
