import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Paw from "@modules/common/icons/paw"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=1000&h=1000&fit=crop&q=80&fm=jpg"

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden border-b border-ui-border-base bg-gradient-to-br from-pastel-pink-100 via-pastel-lavender-100 to-pastel-sky-100">
      <Paw
        size={120}
        className="absolute -left-6 top-10 rotate-[-20deg] text-pastel-pink-200"
      />
      <Paw
        size={90}
        className="absolute right-[42%] bottom-6 rotate-12 text-pastel-lavender-200 hidden small:block"
      />

      <div className="content-container relative grid grid-cols-1 small:grid-cols-2 items-center gap-12 py-16 small:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-small-semi text-pastel-pink-700">
            <Paw size={14} />
            Tienda para perros y gatos
          </span>
          <h1 className="font-display text-4xl small:text-6xl leading-tight text-plum">
            Todo lo que tu mascota ama, en un solo lugar
          </h1>
          <p className="text-large-regular text-plum-soft max-w-md">
            Comida nutritiva, arena que controla olores, camas súper suaves y
            juguetes para jugar todo el día.
          </p>
          <div className="flex flex-wrap gap-3">
            <LocalizedClientLink
              href="/store"
              className="rounded-full bg-pastel-pink-300 px-7 py-3 font-semibold text-plum transition-colors hover:bg-pastel-pink-400"
            >
              Comprar ahora
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/comida"
              className="rounded-full border border-plum/20 bg-white px-7 py-3 font-semibold text-plum transition-colors hover:bg-pastel-lavender-100"
            >
              Ver comida
            </LocalizedClientLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-4 rounded-[3rem] bg-pastel-butter-200 rotate-6" />
          <div className="relative aspect-square overflow-hidden rounded-[3rem] border-8 border-white shadow-elevation-card-rest">
            <Image
              src={HERO_IMAGE}
              alt="Perro feliz con su peluche favorito"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 450px"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 small:-left-10 rounded-large bg-white px-4 py-3 shadow-elevation-card-rest">
            <p className="text-small-semi text-plum">Envío a domicilio</p>
            <p className="text-small-regular text-plum-soft">
              A todo Ecuador
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
