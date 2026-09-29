import FastDelivery from "@modules/common/icons/fast-delivery"
import Package from "@modules/common/icons/package"
import Paw from "@modules/common/icons/paw"

const PERKS = [
  {
    icon: <FastDelivery size={22} />,
    title: "Envío a todo Ecuador",
    text: "Recibe tus compras en la puerta de tu casa.",
    tone: "bg-pastel-mint-100 text-pastel-mint-700",
  },
  {
    icon: <Package size={22} />,
    title: "Compra segura",
    text: "Tus pedidos protegidos de principio a fin.",
    tone: "bg-pastel-sky-100 text-pastel-sky-700",
  },
  {
    icon: <Paw size={22} />,
    title: "Elegidos con cariño",
    text: "Productos pensados para su bienestar.",
    tone: "bg-pastel-butter-100 text-pastel-butter-700",
  },
]

export default function Perks() {
  return (
    <section className="content-container pt-12">
      <ul className="grid grid-cols-1 small:grid-cols-3 gap-4">
        {PERKS.map((perk) => (
          <li
            key={perk.title}
            className="flex items-center gap-4 rounded-large border border-ui-border-base bg-white p-5"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${perk.tone}`}
            >
              {perk.icon}
            </span>
            <div>
              <p className="text-base-semi text-plum">{perk.title}</p>
              <p className="text-small-regular text-plum-soft">{perk.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
