"use client"

import { motion, useReducedMotion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { getTransition } from "@/lib/motion"

interface SubCircleProps {
  icon: LucideIcon
  label: string
  href?: string
  onClick?: () => void
  /** When provided, sub-circle is placed at this position (on the side of parent). Otherwise uses angle/radius. */
  position?: { x: number; y: number }
  angle?: number
  radius?: number
  size?: number
  index: number
  parentPosition: { x: number; y: number }
  /** When true, do not draw the curved line from parent (main orbit circle) to this sub-circle. */
  hideParentLine?: boolean
  /** Color for the parent→sub curved line (matches circle color). */
  lineColor?: string
}

export function SubCircle({
  icon: Icon,
  label,
  href,
  onClick,
  position: explicitPosition,
  angle = 0,
  radius = 95,
  size = 56,
  index,
  parentPosition,
  hideParentLine = false,
  lineColor: groupLineColor,
}: SubCircleProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const t = getTransition(reduced ?? false, { duration: 400, delay: index * 120 })

  const x = explicitPosition
    ? explicitPosition.x
    : parentPosition.x + Math.cos((angle * Math.PI) / 180) * radius
  const y = explicitPosition
    ? explicitPosition.y
    : parentPosition.y + Math.sin((angle * Math.PI) / 180) * radius

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    }
  }

  // Circle ring color: use group line color if provided, else index-based
  const groupColor = groupLineColor ?? "#00c9c8"
  const colors = [
    { from: "#8b5cf6", to: "#ec4899", mid: "rgba(139, 92, 246, 0.4)" },
    { from: "#06b6d4", to: "#8b5cf6", mid: "rgba(6, 182, 212, 0.4)" },
    { from: "#ec4899", to: "#f59e0b", mid: "rgba(236, 72, 153, 0.4)" },
    { from: "#10b981", to: "#06b6d4", mid: "rgba(16, 185, 129, 0.4)" },
  ]
  const color = colors[index % colors.length]
  // Line color: use circle/group color for parent→sub line
  const lineColorFrom = groupLineColor ?? color.from
  const lineColorTo = groupLineColor ?? color.to

  // Calculate curved path for connection line (parent -> this sub-circle)
  const midX = (parentPosition.x + x) / 2
  const midY = (parentPosition.y + y) / 2
  const dx = x - parentPosition.x
  const dy = y - parentPosition.y
  const perp = Math.sqrt(dx * dx + dy * dy) * 0.3
  const ctrlX = midX + (-dy / (Math.sqrt(dx * dx + dy * dy) || 1)) * perp
  const ctrlY = midY + (dx / (Math.sqrt(dx * dx + dy * dy) || 1)) * perp
  const pathD = `M ${parentPosition.x} ${parentPosition.y} Q ${ctrlX} ${ctrlY} ${x} ${y}`

  return (
    <>
      {!hideParentLine && (
        <motion.svg
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            overflow: "visible",
            marginLeft: 0,
            marginTop: 0,
            zIndex: 0,
          }}
          width="1"
          height="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.3, delay: index * 0.06 }}
        >
          <defs>
            <linearGradient id={`subline-${index}-${Math.round(x)}-${Math.round(y)}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={lineColorFrom} stopOpacity="0.6" />
              <stop offset="50%" stopColor={groupColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={lineColorTo} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <motion.path
            d={pathD}
            stroke={`url(#subline-${index}-${Math.round(x)}-${Math.round(y)})`}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            exit={{ pathLength: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
          />
          <motion.path
            d={pathD}
            stroke={lineColorFrom}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.15"
            filter="blur(2px)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            exit={{ pathLength: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
          />
          <motion.circle
          r="2"
          fill={lineColorFrom}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : {
              duration: 1.5,
              delay: index * 0.1 + 0.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              begin={`${index * 0.1 + 0.5}s`}
              path={pathD}
            />
          </motion.circle>
        </motion.svg>
      )}

      {/* Circle button (above all lines) - touch-manipulation so taps work on mobile */}
      <motion.button
        onClick={handleClick}
        className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 group touch-manipulation min-w-[44px] min-h-[44px]"
        style={{
          width: size,
          height: size,
          left: "50%",
          top: "50%",
          marginLeft: -size / 2,
          marginTop: -size / 2,
          zIndex: 1,
        }}
        initial={{
          opacity: 0,
          scale: 0,
          x: parentPosition.x,
          y: parentPosition.y,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: x,
          y: y,
        }}
        exit={{
          opacity: 0,
          scale: 0,
          x: parentPosition.x,
          y: parentPosition.y,
        }}
        whileHover={reduced ? undefined : { scale: 1.15 }}
        whileTap={reduced ? undefined : { scale: 0.9 }}
        transition={t}
        aria-label={label}
        title={label}
      >
        {/* Animated outer glow */}
        <motion.div
          className="absolute rounded-full pointer-events-none opacity-0 group-hover:opacity-100"
          style={{
            width: size + 8,
            height: size + 8,
            background: `radial-gradient(circle, ${color.from}30 0%, transparent 70%)`,
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Outer ring with various gradient (conic / multi-color) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: groupLineColor
              ? `conic-gradient(from 0deg, ${groupLineColor}, #e052a0, ${groupLineColor}, #8b5cf6)`
              : `conic-gradient(from 0deg, ${color.from}, ${color.to}, ${color.mid}, ${color.from})`,
            padding: 1.5,
          }}
          whileHover={{
            boxShadow: groupLineColor
              ? `0 0 20px ${groupLineColor}60, 0 0 40px #e052a040`
              : `0 0 20px ${color.from}60, 0 0 40px ${color.to}40`,
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-full h-full rounded-full bg-[#0a0a0f]" />
        </motion.div>

        {/* Inner content */}
        <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-[#12121a] to-[#0a0a0f] flex flex-col items-center justify-center gap-0.5 p-1 overflow-hidden">
          {/* Hover gradient */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${color.from}15 0%, transparent 60%)`,
            }}
          />

          {/* Icon */}
          <motion.div
            className="relative z-10"
            whileHover={reduced ? undefined : { rotate: [0, -10, 10, 0] }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          >
            <Icon
              className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors duration-200"
              strokeWidth={1.5}
            />
          </motion.div>

          {/* Label */}
          <span className="relative z-10 text-[8px] font-medium text-gray-500 group-hover:text-gray-300 text-center leading-tight truncate max-w-full px-1 transition-colors duration-200">
            {label}
          </span>
        </div>
      </motion.button>
    </>
  )
}