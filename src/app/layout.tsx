import type { Metadata, Viewport } from "next"
import { Montserrat, Playfair_Display } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Regal Furnitures · Orders",
    template: "%s · Regal Furnitures",
  },
  description: "Factory order portal for Regal Furnitures.",
  applicationName: "Regal Orders",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#231f20",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
