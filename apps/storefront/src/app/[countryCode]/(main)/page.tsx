import { Metadata } from "next"

import CategoryGrid from "@modules/home/components/category-grid"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import Perks from "@modules/home/components/perks"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: { absolute: "Huellitas | Tienda de mascotas" },
  description:
    "Comida, arena para gatos, camas y juguetes para consentir a tu mascota.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const [{ collections }, categories] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listCategories().catch(() => []),
  ])

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <Perks />
      <CategoryGrid categories={categories ?? []} />
      <div className="pb-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
