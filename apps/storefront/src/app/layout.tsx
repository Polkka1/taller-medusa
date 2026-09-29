import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fredoka, Nunito } from "next/font/google"
import "styles/globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fredoka",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Huellitas | Tienda de mascotas",
    template: "%s | Huellitas",
  },
  description:
    "Comida, arena para gatos, camas y juguetes para consentir a tu mascota.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      data-mode="light"
      className={`${nunito.variable} ${fredoka.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
