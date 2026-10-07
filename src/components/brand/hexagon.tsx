/** Pointy-top hexagon with softened corners, echoing the Regal mark. */
const HEX_PATH = "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z"

/**
 * Large decorative outline of the hexagon from the Regal mark, for brand panels only
 * (landing and sign-in). Colour comes from `currentColor`.
 */
export function HexOutline({ className, strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" className={className}>
      <path d={HEX_PATH} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}
