import type { Metadata } from "next"
import { LandingPage } from "@/features/landing/components/landing-page"

export const metadata: Metadata = {
  title: { absolute: "Regal Furnitures · Order portal" },
}

/** Public landing page. Signed-in visitors are sent to the dashboard by the proxy. */
export default function Home() {
  return <LandingPage />
}
