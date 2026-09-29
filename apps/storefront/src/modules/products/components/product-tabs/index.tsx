"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Información del producto",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Envíos y devoluciones",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const formatWeight = (grams: number) =>
  grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const category = product.categories?.[0]?.name

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Categoría</span>
            <p>{category ?? "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Material</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">País de origen</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Peso de envío</span>
            <p>{product.weight ? formatWeight(product.weight) : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Dimensiones</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length} x ${product.width} x ${product.height} cm`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Envío a domicilio</span>
            <p className="max-w-sm">
              Tu pedido llega en 3 a 5 días hábiles a la puerta de tu casa,
              para que tu mascota no se quede sin lo que necesita.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Cambios sencillos</span>
            <p className="max-w-sm">
              ¿La cama quedó pequeña o el juguete no le convenció? Te lo
              cambiamos por otra talla o producto sin complicaciones.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Devoluciones fáciles</span>
            <p className="max-w-sm">
              Devuelve los productos sin abrir y te reembolsamos tu dinero.
              La comida y la arena abiertas no admiten devolución por
              higiene.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
