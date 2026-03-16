"use client"

import { motion, useReducedMotion } from "framer-motion"

interface SubCircleLinesProps {
  parentPosition: { x: number; y: number }
  subPositions: { x: number; y: number }[]
  /** Color for non-strict lines (matches circle color). */
  lineColor?: string
}

// Curved path between two points (non-strict, like main circle lines)
function curvedPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  curvature = 0.35
): string {
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const dx = endX - startX
  const dy = endY - startY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const offsetX = (-dy / len) * len * curvature
  const offsetY = (dx / len) * len * curvature
  const ctrlX = midX + offsetX
  const ctrlY = midY + offsetY
  return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`
}

/**
 * Non-strict (curved) lines:
 * - Parent → main sub-circle is drawn by SubCircle for index 0.
 * - Main sub-circle (index 0) → top, right, bottom (and if >3: top-right, bottom-right).
 */
export function SubCircleLines({ parentPosition, subPositions, lineColor = "#00c9c8" }: SubCircleLinesProps) {
  const reduced = useReducedMotion()
  if (subPositions.length < 2) return null

  const main = subPositions[0]
  const others = subPositions.slice(1) // top, right, bottom, [top-right], [bottom-right]

  const lineWidth = 1.2
  const baseDelay = 0.08
  const gradientId = `sub-conn-${lineColor.replace("#", "")}-grad`
  const gradientColorEnd = "#e052a0"

  return (
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ overflow: "visible", zIndex: 0 }}
      width="1"
      height="1"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="50%" stopColor={lineColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={gradientColorEnd} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {others.map((end, i) => {
        const pathD = curvedPath(main.x, main.y, end.x, end.y, 0.28)
        return (
          <motion.path
            key={i}
            d={pathD}
            stroke={`url(#${gradientId})`}
            strokeWidth={lineWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, delay: baseDelay + i * 0.06, ease: "easeOut" }}
          />
        )
      })}
    </svg>
  )
}
