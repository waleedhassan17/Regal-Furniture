import { cn } from "@/lib/utils"

/** Pointy-top hexagon with softened corners, echoing the Regal mark. */
const HEX_PATH = "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z"

type HexFrameProps = {
  children?: React.ReactNode
  size?: number
  /** Outline colour; any CSS colour or var(). */
  stroke?: string
  /** Fill colour inside the frame. */
  fill?: string
  strokeWidth?: number
  className?: string
}

/** Hexagonal frame for icons — the brand's motif for categories, stats and empty states. */
export function HexFrame({
  children,
  size = 48,
  stroke = "var(--sand-strong)",
  fill = "transparent",
  strokeWidth = 5,
  className,
}: HexFrameProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <path d={HEX_PATH} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </svg>
      <span className="relative inline-flex items-center justify-center">{children}</span>
    </span>
  )
}
