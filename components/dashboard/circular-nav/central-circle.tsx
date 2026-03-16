"use client"

import { motion, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getTransition } from "@/lib/motion"
import { useTranslation } from "@/lib/i18n/context"

interface CentralCircleProps {
  size?: number
  onClick?: () => void
}

export function CentralCircle({ size = 120, onClick }: CentralCircleProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const { t: tI18n } = useTranslation()
  const t = getTransition(reduced ?? false, { duration: 800 })

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex items-center justify-center rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black group touch-manipulation min-w-[44px] min-h-[44px]"
      style={{ width: size, height: size }}
      whileHover={reduced ? undefined : { scale: 1.08 }}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={t}
      aria-label={tI18n.nav.dashboard}
    >
      {/* Outer rotating ring (gradient border) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 30,
          height: size + 30,
          background: "linear-gradient(135deg, rgba(0, 201, 200, 0.4), rgba(224, 82, 160, 0.3), rgba(139, 92, 246, 0.2))",
          padding: 1,
        }}
        animate={{ rotate: reduced ? 0 : 360 }}
        transition={{ duration: reduced ? 0 : 30, repeat: reduced ? 0 : Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-[#030306]" />
      </motion.div>

      {/* Second rotating ring (opposite direction, gradient) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 50,
          height: size + 50,
          background: "linear-gradient(225deg, rgba(224, 82, 160, 0.25), rgba(0, 201, 200, 0.2), rgba(139, 92, 246, 0.15))",
          padding: 1,
        }}
        animate={{ rotate: reduced ? 0 : -360 }}
        transition={{ duration: reduced ? 0 : 40, repeat: reduced ? 0 : Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-[#030306]" />
      </motion.div>

      {/* Pulsing outer glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 20,
          height: size + 20,
          background: "radial-gradient(circle, rgba(0, 201, 200, 0.15) 0%, transparent 70%)",
        }}
        animate={reduced ? {} : { scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: reduced ? 0 : 3, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* Main gradient ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #00c9c8, #e052a0, #8b5cf6, #00c9c8)",
          padding: 3,
        }}
        animate={{ rotate: reduced ? 0 : [0, 360] }}
        transition={{ duration: reduced ? 0 : 8, repeat: reduced ? 0 : Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f]" />
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={reduced ? {} : {
          boxShadow: [
            "0 0 20px rgba(0, 201, 200, 0.3), 0 0 40px rgba(224, 82, 160, 0.2), 0 0 60px rgba(139, 92, 246, 0.1)",
            "0 0 30px rgba(0, 201, 200, 0.5), 0 0 60px rgba(224, 82, 160, 0.3), 0 0 80px rgba(139, 92, 246, 0.2)",
            "0 0 20px rgba(0, 201, 200, 0.3), 0 0 40px rgba(224, 82, 160, 0.2), 0 0 60px rgba(139, 92, 246, 0.1)",
          ],
        }}
        transition={{ duration: reduced ? 0 : 2, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* Inner content container */}
      <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center overflow-hidden">
        {/* Animated inner gradient */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(0, 201, 200, 0.1), transparent, rgba(224, 82, 160, 0.1), transparent)",
          }}
          animate={{ rotate: reduced ? 0 : [0, -360] }}
          transition={{ duration: reduced ? 0 : 10, repeat: reduced ? 0 : Infinity, ease: "linear" }}
        />
      </div>

      {/* Logo: same size as inner circle — fill container so image matches exactly */}
      <motion.div
        className="absolute z-10 flex items-center justify-center rounded-full overflow-hidden relative"
        style={{
          left: 3,
          top: 3,
          width: size - 6,
          height: size - 6,
        }}
        whileHover={reduced ? undefined : { scale: 1.05 }}
        transition={{ duration: reduced ? 0 : 0.3 }}
      >
        <Image
          src="/images/nairi-logo-header.jpg"
          alt="Nairi"
          fill
          sizes={`${size - 6}px`}
          className="rounded-full object-cover"
          priority
        />
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          initial={{ x: "-100%", y: "-100%" }}
          whileHover={reduced ? undefined : { x: "100%", y: "100%" }}
          transition={{ duration: reduced ? 0 : 0.6 }}
        />
      </motion.div>

      {/* Hover ring effect */}
      <motion.div
        className="absolute inset-[-8px] rounded-full border border-cyan-400/0 group-hover:border-cyan-400/30 transition-colors duration-300"
      />

      {/* Label on hover */}
      <motion.div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <span className="text-xs text-cyan-400/80 font-medium tracking-wider">{tI18n.nav.dashboard.toUpperCase()}</span>
      </motion.div>
    </motion.button>
  )
}