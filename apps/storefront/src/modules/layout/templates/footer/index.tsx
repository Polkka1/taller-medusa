import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { Text, clx } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";
import Paw from "@modules/common/icons/paw";

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });
  const productCategories = await listCategories();

  return (
    <footer className="w-full border-t border-ui-border-base bg-pastel-lavender-100">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-20">
          <div className="flex flex-col gap-y-3 max-w-xs">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-x-2 font-display text-2xl text-plum"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-pastel-pink-200 text-pastel-pink-700">
                <Paw size={20} />
              </span>
              Huellitas
            </LocalizedClientLink>
            <Text className="txt-small text-plum-soft">
              Tu tienda de confianza para consentir a perros y gatos: comida,
              arena, camas y juguetes.
            </Text>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-plum">Categorías</span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return;
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null;

                    return (
                      <li
                        className="flex flex-col gap-2 text-plum-soft txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-plum",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-plum"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-plum">Colecciones</span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-plum-soft txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-plum"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus text-plum">Tu cuenta</span>
              <ul className="grid grid-cols-1 gap-y-2 text-plum-soft txt-small">
                <li>
                  <LocalizedClientLink className="hover:text-plum" href="/account">
                    Mi cuenta
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink className="hover:text-plum" href="/cart">
                    Carrito
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink className="hover:text-plum" href="/store">
                    Todos los productos
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-12 justify-between border-t border-pastel-lavender-200 pt-6 text-plum-soft">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Huellitas. Todos los derechos
            reservados.
          </Text>
          <Text className="txt-compact-small hidden xsmall:block">
            Hecho con cariño para tus peludos
          </Text>
        </div>
      </div>
    </footer>
  );
}
