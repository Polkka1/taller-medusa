import Image from "next/image"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&q=80&fm=jpg`

/** Look of each pet category's card, keyed by category handle. */
const CATEGORY_STYLES: Record<string, { image: string; card: string }> = {
  comida: {
    image: unsplash("1568640347023-a616a30bc3bd"),
    card: "bg-pastel-peach-100 hover:bg-pastel-peach-200",
  },
  "arena-para-gatos": {
    image: unsplash("1727510153658-643787acb16a"),
    card: "bg-pastel-mint-100 hover:bg-pastel-mint-200",
  },
  camas: {
    image: unsplash("1541188495357-ad2dc89487f4"),
    card: "bg-pastel-lavender-100 hover:bg-pastel-lavender-200",
  },
  juguetes: {
    image: unsplash("1722257401181-a04cc4df36f8"),
    card: "bg-pastel-sky-100 hover:bg-pastel-sky-200",
  },
}

const FALLBACK_CARD = "bg-pastel-pink-100 hover:bg-pastel-pink-200"

export default function CategoryGrid({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) {
  const topCategories = categories.filter((c) => !c.parent_category)

  if (!topCategories.length) {
    return null
  }

  return (
    <section className="content-container py-16">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-small-semi uppercase tracking-wider text-pastel-pink-700">
          Categorías
        </span>
        <h2 className="font-display text-3xl text-plum">
          ¿Qué necesita tu mascota hoy?
        </h2>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-6">
        {topCategories.map((category) => {
          const style = CATEGORY_STYLES[category.handle]

          return (
            <li key={category.id}>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className={clx(
                  "group flex h-full flex-col gap-4 rounded-[2rem] p-4 transition-colors",
                  style?.card ?? FALLBACK_CARD
                )}
              >
                {style && (
                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-white">
                    <Image
                      src={style.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 1024px) 45vw, 300px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="px-2 pb-2">
                  <h3 className="font-display text-xl text-plum">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-1 text-small-regular text-plum-soft">
                      {category.description}
                    </p>
                  )}
                </div>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
