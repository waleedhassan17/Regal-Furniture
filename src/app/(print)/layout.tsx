/** Bare layout for print views: no navigation, white paper on screen and in print. */
export default function PrintLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-dvh bg-sand-soft print:bg-white">{children}</div>
}
