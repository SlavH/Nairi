"use client"

import { motion, useReducedMotion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { getTransition } from "@/lib/motion"

interface NavCircleProps {
  icon: LucideIcon
  label: string
  position: "top" | "top-right" | "right" | "bottom-right" | "bottom" | "bottom-left" | "left" | "top-left"
  orbitRadius: number
  size?: number
  href?: string
  onClick?: () => void
  isActive?: boolean
  hasSubCircles?: boolean
  delay?: number
  /** CSS gradient for the circle border (e.g. "linear-gradient(135deg, #00c9c8, #e052a0)") */
  borderGradient?: string
  /** When set, overrides position/orbitRadius and places the circle at (x, y) */
  customPosition?: { x: number; y: number }
}

// Calculate position based on cardinal direction (and diagonals)
const getPosition = (position: string, orbitRadius: number) => {
  const r = orbitRadius * 0.707 // cos/sin 45°
  switch (position) {
    case "top":
      return { x: 0, y: -orbitRadius }
    case "top-right":
      return { x: r, y: -r }
    case "right":
      return { x: orbitRadius, y: 0 }
    case "bottom-right":
      return { x: r, y: r }
    case "bottom":
      return { x: 0, y: orbitRadius }
    case "bottom-left":
      return { x: -r, y: r }
    case "left":
      return { x: -orbitRadius, y: 0 }
    case "top-left":
      return { x: -r, y: -r }
    default:
      return { x: 0, y: 0 }
  }
}

const DEFAULT_BORDER_GRADIENT = "linear-gradient(135deg, rgba(0, 201, 200, 0.6) 0%, rgba(224, 82, 160, 0.6) 100%)"

export function NavCircle({
  icon: Icon,
  label,
  position,
  orbitRadius,
  size = 80,
  href,
  onClick,
  isActive = false,
  hasSubCircles = false,
  delay = 0,
  borderGradient = DEFAULT_BORDER_GRADIENT,
  customPosition,
}: NavCircleProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const t = getTransition(reduced ?? false, { duration: 600, delay: (delay ?? 0) * 1000 })
  const pos = customPosition ?? getPosition(position, orbitRadius)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 group touch-manipulation min-w-[44px] min-h-[44px]"
      style={{
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: pos.x,
        y: pos.y,
      }}
      whileHover={reduced ? undefined : { scale: 1.12 }}
      whileTap={reduced ? undefined : { scale: 0.92 }}
      transition={t}
      aria-label={label}
      title={label}
    >
      {/* Rotating dashed ring when active */}
      {isActive && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size + 16,
            height: size + 16,
            border: "1px dashed rgba(0, 201, 200, 0.4)",
          }}
          animate={{ rotate: reduced ? 0 : 360 }}
          transition={{ duration: reduced ? 0 : 10, repeat: reduced ? 0 : Infinity, ease: "linear" }}
        />
      )}

      {/* Outer pulsing glow when active */}
      {isActive && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size + 10,
            height: size + 10,
            background: "radial-gradient(circle, rgba(0, 201, 200, 0.2) 0%, transparent 70%)",
          }}
          animate={reduced ? {} : { scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: reduced ? 0 : 2, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Outer ring with gradient stroke (various per circle) */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isActive
            ? "conic-gradient(from 0deg, #00c9c8, #e052a0, #8b5cf6, #00c9c8)"
            : borderGradient,
          padding: 2,
        }}
        animate={{
          boxShadow: isActive
            ? "0 0 25px rgba(0, 201, 200, 0.5), 0 0 50px rgba(224, 82, 160, 0.3)"
            : "0 0 10px rgba(0, 201, 200, 0.15), 0 0 20px rgba(224, 82, 160, 0.1)",
          rotate: reduced ? 0 : (isActive ? [0, 360] : 0),
        }}
        whileHover={{
          boxShadow: "0 0 30px rgba(0, 201, 200, 0.6), 0 0 60px rgba(224, 82, 160, 0.4)",
        }}
        transition={{
          boxShadow: { duration: reduced ? 0 : 0.3 },
          rotate: { duration: reduced ? 0 : 8, repeat: reduced ? 0 : Infinity, ease: "linear" },
        }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f]" />
      </motion.div>

      {/* Inner content */}
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-[#0f0f1a] to-[#0a0a0f] flex flex-col items-center justify-center gap-1 overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(0, 201, 200, 0.1) 0%, transparent 50%)",
          }}
        />

        {/* Icon with animation */}
        <motion.div
          animate={reduced ? {} : (isActive ? { y: [0, -2, 0] } : {})}
          transition={{ duration: reduced ? 0 : 1.5, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        >
          <Icon
            className={`w-5 h-5 transition-colors duration-300 ${
              isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-200"
            }`}
            strokeWidth={1.5}
          />
        </motion.div>

        {/* Label */}
        <span
          className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
            isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"
          }`}
        >
          {label}
        </span>
        
      </div>

      {/* Hover ring - centered with same transform origin as circle */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent group-hover:border-cyan-400/20 transition-colors duration-300"
        style={{ width: size + 8, height: size + 8 }}
      />

      {/* Connection line to center (visual) */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 1,
          height: orbitRadius - size / 2,
          background: `linear-gradient(to ${position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left'}, transparent, rgba(0, 201, 200, 0.1), transparent)`,
          transformOrigin: position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left',
          ...(position === 'top' && { bottom: -orbitRadius + size / 2, left: '50%', marginLeft: -0.5 }),
          ...(position === 'bottom' && { top: -orbitRadius + size / 2, left: '50%', marginLeft: -0.5 }),
          ...(position === 'left' && { right: -orbitRadius + size / 2, top: '50%', marginTop: -0.5, width: orbitRadius - size / 2, height: 1 }),
          ...(position === 'right' && { left: -orbitRadius + size / 2, top: '50%', marginTop: -0.5, width: orbitRadius - size / 2, height: 1 }),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}