/**
 * Turns the store into "Huellitas", a pet shop: pet categories, two
 * collections (dogs and cats), 15 pet products with stock, and the store name.
 * The clothing starter products and "Cafe de loja" are moved to draft and the
 * clothing categories are deactivated, so nothing is deleted and both can be
 * restored from the Admin.
 *
 *   pnpm medusa exec ./src/scripts/seed-pet-store.ts
 *
 * Idempotent: categories, collections and products are matched by handle and
 * only created when missing.
 */
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductCategoriesWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

const STORE_NAME = "Huellitas"
const STOCKED_QUANTITY = 100
/** Products per awaited search-ingestion call. */
const INGEST_CHUNK_SIZE = 25

/** Starter products that don't fit a pet shop. Moved to draft, not deleted. */
const RETIRED_PRODUCT_HANDLES = [
  "t-shirt",
  "sweatpants",
  "shorts",
  "sweatshirt",
  "cafe-de-loja",
]
const RETIRED_CATEGORY_HANDLES = ["shirts", "sweatshirts", "pants", "merch"]

const CATEGORIES = [
  {
    handle: "comida",
    name: "Comida",
    description:
      "Croquetas y snacks nutritivos para perros y gatos de todas las edades.",
  },
  {
    handle: "arena-para-gatos",
    name: "Arena para gatos",
    description:
      "Arenas aglomerantes, de sílice y ecológicas que controlan los olores.",
  },
  {
    handle: "camas",
    name: "Camas",
    description: "Camas suaves y acolchadas para que descansen como merecen.",
  },
  {
    handle: "juguetes",
    name: "Juguetes",
    description: "Juguetes resistentes para jugar, morder y cazar en casa.",
  },
]

const COLLECTIONS = [
  { handle: "mundo-perruno", title: "Mundo perruno" },
  { handle: "rincon-gatuno", title: "Rincón gatuno" },
]

/**
 * Display order of an option's values (smallest first). Without ranks the
 * storefront lists them alphabetically: "Grande, Mediano, Pequeño".
 */
const optionRanks = (product: PetProduct) =>
  Object.fromEntries(
    product.variants.map((variant, index) => [variant.value, index + 1])
  )

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1000&h=1000&fit=crop&q=80&fm=jpg`

type PetProduct = {
  handle: string
  title: string
  subtitle: string
  description: string
  category: string
  collection: string
  image: string
  weight: number
  option: string
  /** Option value and its price in USD. EUR is one unit less. */
  variants: { value: string; usd: number }[]
}

const PRODUCTS: PetProduct[] = [
  // ---- Comida -------------------------------------------------------------
  {
    handle: "croquetas-perro-adulto-pollo-arroz",
    title: "Croquetas Perro Adulto Pollo y Arroz",
    subtitle: "Alimento completo para perros adultos",
    description:
      "Croquetas con pollo como primer ingrediente, arroz integral y omega 3 y 6 para un pelaje brillante y una digestión saludable. Sin colorantes artificiales.",
    category: "comida",
    collection: "mundo-perruno",
    image: unsplash("1676193866128-03a926df76ef"),
    weight: 3000,
    option: "Peso",
    variants: [
      { value: "3 kg", usd: 18.99 },
      { value: "7 kg", usd: 36.99 },
      { value: "15 kg", usd: 68.99 },
    ],
  },
  {
    handle: "alimento-cachorro-crecimiento",
    title: "Alimento Cachorro Crecimiento Sano",
    subtitle: "Para cachorros de 2 a 12 meses",
    description:
      "Fórmula con DHA, calcio y proteína de alta calidad para acompañar el desarrollo de huesos, músculos y cerebro. Croqueta pequeña, fácil de masticar.",
    category: "comida",
    collection: "mundo-perruno",
    image: unsplash("1714068691210-073dc52c6c1d"),
    weight: 1000,
    option: "Peso",
    variants: [
      { value: "1 kg", usd: 9.99 },
      { value: "3 kg", usd: 22.99 },
      { value: "7 kg", usd: 44.99 },
    ],
  },
  {
    handle: "croquetas-gato-adulto-salmon",
    title: "Croquetas Gato Adulto Salmón",
    subtitle: "Alimento completo para gatos adultos",
    description:
      "Croquetas con salmón real, taurina y fibra natural que ayuda a controlar las bolas de pelo. Cuida el tracto urinario y mantiene un peso saludable.",
    category: "comida",
    collection: "rincon-gatuno",
    image: unsplash("1596854331442-3cf47265cefb"),
    weight: 1000,
    option: "Peso",
    variants: [
      { value: "1 kg", usd: 10.99 },
      { value: "3 kg", usd: 25.99 },
      { value: "7 kg", usd: 52.99 },
    ],
  },
  {
    handle: "galletas-huesitos-avena-mani",
    title: "Galletas Huesitos de Avena y Maní",
    subtitle: "Premios horneados para perros",
    description:
      "Galletas crujientes horneadas con avena y mantequilla de maní, sin azúcar añadida. Ideales como premio durante el entrenamiento.",
    category: "comida",
    collection: "mundo-perruno",
    image: unsplash("1568640347023-a616a30bc3bd"),
    weight: 250,
    option: "Peso",
    variants: [
      { value: "250 g", usd: 4.99 },
      { value: "500 g", usd: 8.99 },
    ],
  },

  // ---- Arena para gatos ---------------------------------------------------
  {
    handle: "arena-aglomerante-ultra",
    title: "Arena Aglomerante Ultra Absorbente",
    subtitle: "Bentonita de grano fino",
    description:
      "Forma bolitas firmes al instante para retirar solo lo necesario. Baja en polvo y con aroma suave a talco que neutraliza los olores hasta por 7 días.",
    category: "arena-para-gatos",
    collection: "rincon-gatuno",
    image: unsplash("1727510153658-643787acb16a"),
    weight: 5000,
    option: "Peso",
    variants: [
      { value: "5 kg", usd: 11.99 },
      { value: "10 kg", usd: 20.99 },
    ],
  },
  {
    handle: "arena-silice-control-olores",
    title: "Arena de Sílice Control de Olores",
    subtitle: "Cristales que absorben la humedad",
    description:
      "Cristales de sílice que atrapan la humedad y los olores sin formar grumos. Rinde hasta un mes para un gato y deja las patitas limpias.",
    category: "arena-para-gatos",
    collection: "rincon-gatuno",
    image: unsplash("1572266071126-492372e7a001"),
    weight: 3000,
    option: "Peso",
    variants: [
      { value: "3 kg", usd: 14.99 },
      { value: "7 kg", usd: 28.99 },
    ],
  },
  {
    handle: "arena-ecologica-tofu-te-verde",
    title: "Arena Ecológica de Tofu Té Verde",
    subtitle: "Biodegradable y apta para el inodoro",
    description:
      "Arena vegetal de fibra de soya con extracto de té verde. Aglomera rápido, es biodegradable y se puede desechar en pequeñas cantidades por el inodoro.",
    category: "arena-para-gatos",
    collection: "rincon-gatuno",
    image: unsplash("1516750105099-4b8a83e217ee"),
    weight: 3000,
    option: "Peso",
    variants: [
      { value: "3 kg", usd: 13.99 },
      { value: "7 kg", usd: 27.99 },
    ],
  },

  // ---- Camas --------------------------------------------------------------
  {
    handle: "cama-ortopedica-nube",
    title: "Cama Ortopédica Nube",
    subtitle: "Espuma viscoelástica para perros",
    description:
      "Base de espuma viscoelástica que alivia las articulaciones, bordes elevados para apoyar la cabeza y funda removible lavable a máquina.",
    category: "camas",
    collection: "mundo-perruno",
    image: unsplash("1581888227599-779811939961"),
    weight: 2500,
    option: "Tamaño",
    variants: [
      { value: "Pequeño", usd: 34.99 },
      { value: "Mediano", usd: 47.99 },
      { value: "Grande", usd: 61.99 },
    ],
  },
  {
    handle: "cama-donut-antiestres",
    title: "Cama Donut Antiestrés",
    subtitle: "Peluche esponjoso y redondo",
    description:
      "Cama redonda de peluche extra suave con bordes altos que dan sensación de refugio. Ayuda a calmar la ansiedad y conserva el calor corporal.",
    category: "camas",
    collection: "mundo-perruno",
    image: unsplash("1601758123927-4f7acc7da589"),
    weight: 1500,
    option: "Tamaño",
    variants: [
      { value: "Pequeño", usd: 28.99 },
      { value: "Mediano", usd: 38.99 },
      { value: "Grande", usd: 48.99 },
    ],
  },
  {
    handle: "cama-cojin-lunares",
    title: "Cama Cojín de Lunares",
    subtitle: "Acolchada con base antideslizante",
    description:
      "Cojín mullido con estampado de lunares, relleno de fibra hueca y base antideslizante. Perfecta para la sala o para llevar de viaje.",
    category: "camas",
    collection: "mundo-perruno",
    image: unsplash("1646195164326-124b72fb9d34"),
    weight: 1800,
    option: "Tamaño",
    variants: [
      { value: "Mediano", usd: 31.99 },
      { value: "Grande", usd: 43.99 },
    ],
  },
  {
    handle: "cama-nido-borrego-gato",
    title: "Cama Nido de Borrego para Gato",
    subtitle: "Tela tipo borrego súper suave",
    description:
      "Nido redondo forrado en tela tipo borrego que imita el calor de mamá gata. Bordes acolchados para acurrucarse y base lavable.",
    category: "camas",
    collection: "rincon-gatuno",
    image: unsplash("1541188495357-ad2dc89487f4"),
    weight: 900,
    option: "Tamaño",
    variants: [
      { value: "Pequeño", usd: 25.99 },
      { value: "Mediano", usd: 30.99 },
    ],
  },

  // ---- Juguetes -----------------------------------------------------------
  {
    handle: "pelota-interactiva-panal",
    title: "Pelota Interactiva de Panal",
    subtitle: "Caucho flexible para morder y lanzar",
    description:
      "Pelota de caucho natural con diseño de panal que rebota de forma impredecible. Puedes rellenarla con premios para que el juego dure más.",
    category: "juguetes",
    collection: "mundo-perruno",
    image: unsplash("1722257401181-a04cc4df36f8"),
    weight: 200,
    option: "Tamaño",
    variants: [
      { value: "Mediano", usd: 10.99 },
      { value: "Grande", usd: 13.99 },
    ],
  },
  {
    handle: "peluche-elefante-sonido",
    title: "Peluche Elefante con Sonido",
    subtitle: "Peluche con chifle interno",
    description:
      "Elefante de peluche con costuras reforzadas y chifle interno. Suave para cachorros y perros que aman cargar su juguete a todas partes.",
    category: "juguetes",
    collection: "mundo-perruno",
    image: unsplash("1591946614720-90a587da4a36"),
    weight: 250,
    option: "Tamaño",
    variants: [
      { value: "Mediano", usd: 12.99 },
      { value: "Grande", usd: 15.99 },
    ],
  },
  {
    handle: "varita-plumas-cascabel",
    title: "Varita con Plumas y Cascabel",
    subtitle: "Juguete interactivo para gatos",
    description:
      "Varita flexible con pompón, plumas y cascabel que despierta el instinto cazador. Ideal para jugar juntos y mantener a tu gato activo.",
    category: "juguetes",
    collection: "rincon-gatuno",
    image: unsplash("1768859336207-3c3ba2027cca"),
    weight: 100,
    option: "Presentación",
    variants: [
      { value: "Unidad", usd: 6.99 },
      { value: "Pack x3", usd: 16.99 },
    ],
  },
  {
    handle: "rascador-sisal-pez-colgante",
    title: "Rascador de Sisal con Pez Colgante",
    subtitle: "Poste de sisal natural",
    description:
      "Poste forrado en sisal natural con base estable y un pez de peluche colgante. Protege tus muebles y mantiene las uñas en buen estado.",
    category: "juguetes",
    collection: "rincon-gatuno",
    image: unsplash("1545249390-6bdfa286032f"),
    weight: 1200,
    option: "Tamaño",
    variants: [
      { value: "Mediano", usd: 19.99 },
      { value: "Grande", usd: 29.99 },
    ],
  },
]

export default async function seedPetStore({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // ---- Prerequisites ------------------------------------------------------

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "name"],
  })

  const salesChannel = salesChannels[0]
  const shippingProfile = shippingProfiles[0]
  const stockLocation = stockLocations[0]
  const store = stores[0]

  if (!salesChannel || !shippingProfile || !stockLocation || !store) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Missing sales channel, shipping profile, stock location or store. Run the initial data seed first."
    )
  }

  // ---- Store name ---------------------------------------------------------

  if (store.name !== STORE_NAME) {
    await updateStoresWorkflow(container).run({
      input: { selector: { id: store.id }, update: { name: STORE_NAME } },
    })
    logger.info(`Renamed store to "${STORE_NAME}".`)
  }

  // ---- Retire the clothing starter data -----------------------------------

  const { data: retiredProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status"],
    filters: { handle: RETIRED_PRODUCT_HANDLES },
  })
  const toDraft = retiredProducts.filter(
    (product) => product.status !== ProductStatus.DRAFT
  )

  if (toDraft.length) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: toDraft.map((product) => product.id) },
        update: { status: ProductStatus.DRAFT },
      },
    })
    logger.info(
      `Moved to draft: ${toDraft.map((product) => product.handle).join(", ")}`
    )
  }

  const { data: retiredCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "is_active"],
    filters: { handle: RETIRED_CATEGORY_HANDLES },
  })
  const toDeactivate = retiredCategories.filter((category) => category.is_active)

  if (toDeactivate.length) {
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: toDeactivate.map((category) => category.id) },
        update: { is_active: false },
      },
    })
    logger.info(
      `Deactivated categories: ${toDeactivate.map((category) => category.handle).join(", ")}`
    )
  }

  // ---- Categories ---------------------------------------------------------

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: CATEGORIES.map((category) => category.handle) },
  })
  const missingCategories = CATEGORIES.filter(
    (category) =>
      !existingCategories.some((existing) => existing.handle === category.handle)
  )

  if (missingCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((category) => ({
          ...category,
          is_active: true,
        })),
      },
    })
    logger.info(`Created ${missingCategories.length} categor(ies).`)
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: CATEGORIES.map((category) => category.handle) },
  })
  const categoryId = new Map(
    categories.map((category) => [category.handle, category.id])
  )

  // ---- Collections --------------------------------------------------------

  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle"],
    filters: { handle: COLLECTIONS.map((collection) => collection.handle) },
  })
  const missingCollections = COLLECTIONS.filter(
    (collection) =>
      !existingCollections.some(
        (existing) => existing.handle === collection.handle
      )
  )

  if (missingCollections.length) {
    await createCollectionsWorkflow(container).run({
      input: { collections: missingCollections },
    })
    logger.info(`Created ${missingCollections.length} collection(s).`)
  }

  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle"],
    filters: { handle: COLLECTIONS.map((collection) => collection.handle) },
  })
  const collectionId = new Map(
    collections.map((collection) => [collection.handle, collection.id])
  )

  // ---- Products -----------------------------------------------------------

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: PRODUCTS.map((product) => product.handle) },
  })
  const takenHandles = new Set(
    existingProducts.map((product) => product.handle)
  )
  const newProducts = PRODUCTS.filter(
    (product) => !takenHandles.has(product.handle)
  )

  if (newProducts.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: newProducts.map((product) => ({
          title: product.title,
          handle: product.handle,
          subtitle: product.subtitle,
          description: product.description,
          status: ProductStatus.PUBLISHED,
          thumbnail: product.image,
          images: [{ url: product.image }],
          weight: product.weight,
          shipping_profile_id: shippingProfile.id,
          category_ids: [categoryId.get(product.category)!],
          collection_id: collectionId.get(product.collection),
          sales_channels: [{ id: salesChannel.id }],
          options: [
            {
              title: product.option,
              values: product.variants.map((variant) => variant.value),
              ranks: optionRanks(product),
            },
          ],
          variants: product.variants.map((variant, index) => ({
            title: variant.value,
            sku: `${product.handle.toUpperCase()}-${index + 1}`,
            manage_inventory: true,
            options: { [product.option]: variant.value },
            prices: [
              { amount: variant.usd, currency_code: "usd" },
              {
                amount: Math.round((variant.usd - 1) * 100) / 100,
                currency_code: "eur",
              },
            ],
          })),
        })),
      },
    })
    logger.info(`Created ${newProducts.length} pet product(s).`)
  } else {
    logger.info("Every pet product already exists.")
  }

  // ---- Option value order -------------------------------------------------

  // Products created before ranks were set list their values alphabetically.
  const { data: rankedProducts } = await query.graph({
    entity: "product",
    fields: ["handle", "options.id", "options.values.rank"],
    filters: { handle: PRODUCTS.map((product) => product.handle) },
  })

  for (const row of rankedProducts) {
    const product = PRODUCTS.find((candidate) => candidate.handle === row.handle)
    const option = row.options?.[0]

    if (!product || !option) {
      continue
    }

    // `rank` exists since Medusa 2.16 but is missing from the generated
    // query types.
    const unranked = (option.values ?? []).some(
      (value) => (value as { rank?: number | null } | null)?.rank == null
    )

    if (unranked) {
      await updateProductOptionsWorkflow(container).run({
        input: {
          selector: { id: option.id },
          update: { ranks: optionRanks(product) },
        },
      })
      logger.info(`Ordered the option values of "${product.handle}".`)
    }
  }

  // ---- Stock --------------------------------------------------------------

  const { data: petVariants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "inventory_items.inventory_item_id"],
    filters: {
      sku: PRODUCTS.flatMap((product) =>
        product.variants.map(
          (_, index) => `${product.handle.toUpperCase()}-${index + 1}`
        )
      ),
    },
  })
  const inventoryItemIds = petVariants
    .flatMap((variant) => variant.inventory_items ?? [])
    .map((link) => link?.inventory_item_id)
    .filter((id): id is string => Boolean(id))

  const { data: levels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id"],
    filters: {
      inventory_item_id: inventoryItemIds,
      location_id: stockLocation.id,
    },
  })
  const stocked = new Set(levels.map((level) => level.inventory_item_id))
  const unstocked = inventoryItemIds.filter((id) => !stocked.has(id))

  if (unstocked.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: unstocked.map((inventory_item_id) => ({
          inventory_item_id,
          location_id: stockLocation.id,
          stocked_quantity: STOCKED_QUANTITY,
        })),
      },
    })
    logger.info(
      `Stocked ${STOCKED_QUANTITY} units of ${unstocked.length} variant(s) at "${stockLocation.name}".`
    )
  }

  // ---- Make sure the search index caught up -------------------------------

  // Product events are handled asynchronously on the local event bus, so a
  // short-lived `medusa exec` process can exit before they are ingested.
  // `consume` upserts, so replaying over every product is safe.
  const search = container.resolve(Modules.SEARCH)
  const { data: allProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
  })

  for (let start = 0; start < allProducts.length; start += INGEST_CHUNK_SIZE) {
    const chunk = allProducts.slice(start, start + INGEST_CHUNK_SIZE)

    await search.ingest({
      name: "product.updated",
      data: chunk.map((product) => ({ id: product.id })),
    } as never)
  }

  logger.info(`Search index caught up for ${allProducts.length} product(s).`)
  logger.info(`Done. "${STORE_NAME}" is ready.`)
}
