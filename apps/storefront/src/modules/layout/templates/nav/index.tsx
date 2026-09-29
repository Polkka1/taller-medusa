import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Paw from "@modules/common/icons/paw"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listCategories().catch(() => []),
  ])

  const topCategories = (categories ?? []).filter((c) => !c.parent_category)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-pastel-pink-50 border-ui-border-base">
        <nav className="content-container text-ui-fg-subtle font-semibold flex items-center justify-between w-full h-full text-base-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-x-2 font-display text-xl small:text-2xl text-plum hover:text-pastel-pink-700 transition-colors"
              data-testid="nav-store-link"
            >
              <span className="hidden xsmall:flex items-center justify-center w-9 h-9 rounded-full bg-pastel-pink-200 text-pastel-pink-700">
                <Paw size={20} />
              </span>
              Huellitas
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-4 small:gap-x-6 h-full flex-1 basis-0 justify-end whitespace-nowrap">
            <Search />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Mi cuenta
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Carrito (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
      {topCategories.length > 0 && (
        <div className="hidden small:block bg-white/90 backdrop-blur border-b border-ui-border-base">
          <ul className="content-container flex items-center justify-center gap-x-3 h-12 text-small-semi">
            <li>
              <LocalizedClientLink
                href="/store"
                className="px-4 py-1.5 rounded-full text-plum hover:bg-pastel-lavender-100 transition-colors"
              >
                Todos los productos
              </LocalizedClientLink>
            </li>
            {topCategories.map((category) => (
              <li key={category.id}>
                <LocalizedClientLink
                  href={`/categories/${category.handle}`}
                  className="px-4 py-1.5 rounded-full text-plum hover:bg-pastel-lavender-100 transition-colors"
                >
                  {category.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
