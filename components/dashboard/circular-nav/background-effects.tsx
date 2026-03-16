"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

// Star component for galaxy effect
function Star({ size, x, y, delay, duration, reduced }: { size: number; x: number; y: number; delay: number; duration: number; reduced?: boolean }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: "white",
      }}
      animate={reduced ? { opacity: 0.4, scale: 1 } : { opacity: [0.1, 0.7, 0.1], scale: [1, 1.3, 1] }}
      transition={{ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
    />
  )
}

// Nebula cloud component - Nairi colors
function NebulaCloud({ color, x, y, size, blur, delay, reduced }: { color: string; x: number; y: number; size: number; blur: number; delay: number; reduced?: boolean }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={reduced ? { opacity: 0.5, scale: 1, x: 0, y: 0 } : { opacity: [0.4, 0.6, 0.4], scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: reduced ? 0 : 20, delay: reduced ? 0 : delay, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
    />
  )
}

// Shooting star component
function ShootingStar({ delay, x, y, repeatDelay, reduced }: { delay: number; x: number; y: number; repeatDelay: number; reduced?: boolean }) {
  if (reduced) return null
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: 80,
        height: 1,
        left: `${x}%`,
        top: `${y}%`,
        background: "linear-gradient(90deg, transparent, rgba(0, 201, 200, 0.8), transparent)",
        transformOrigin: "left center",
      }}
      initial={{ opacity: 0, scaleX: 0, rotate: 25 }}
      animate={{
        opacity: [0, 1, 0],
        scaleX: [0, 1, 0],
        x: [0, 150],
        y: [0, 90],
      }}
      transition={{
        duration: 1.2,
        delay,
        repeat: Infinity,
        repeatDelay,
        ease: "easeOut",
      }}
    />
  )
}

// Orbiting particle around navigation
function OrbitingParticle({ radius, duration, size, color, startAngle = 0, reduced }: { radius: number; duration: number; size: number; color: string; startAngle?: number; reduced?: boolean }) {
  if (reduced) return null
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      animate={{ rotate: [startAngle, startAngle + 360] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 ${size * 4}px ${color}`,
          transform: `translateX(${radius}px)`,
        }}
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  )
}

// Corner decorations
function CornerDecorations({ reduced }: { reduced?: boolean }) {
  const corners = [
    { position: "top-4 left-4", rotate: 0 },
    { position: "top-4 right-4", rotate: 90 },
    { position: "bottom-4 right-4", rotate: 180 },
    { position: "bottom-4 left-4", rotate: 270 },
  ]

  return (
    <>
      {corners.map((corner, i) => (
        <motion.div
          key={i}
          className={`absolute ${corner.position} w-10 h-10 pointer-events-none`}
          style={{ transform: `rotate(${corner.rotate}deg)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 0.8 + i * 0.1 }}
        >
          <div className="absolute top-0 left-0 w-5 h-[1px] bg-gradient-to-r from-cyan-500/30 to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-5 bg-gradient-to-b from-cyan-500/30 to-transparent" />
        </motion.div>
      ))}
    </>
  )
}

type StarConfig = {
  id: number
  size: number
  x: number
  y: number
  delay: number
  duration: number
}

type ShootingStarConfig = {
  id: number
  delay: number
  x: number
  y: number
  repeatDelay: number
}

export function BackgroundEffects({ orbitRadius }: { orbitRadius: number }) {
  const reduced = useReducedMotion()
  const [stars, setStars] = useState<StarConfig[]>([])
  const [shootingStars, setShootingStars] = useState<ShootingStarConfig[]>([])

  // Generate stars and shooting stars on the client only to avoid SSR randomness
  useEffect(() => {
    const generatedStars: StarConfig[] = [...Array(100)].map((_, i) => ({
      id: i,
      size: Math.random() < 0.2 ? 2 : 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4,
    }))

    const generatedShootingStars: ShootingStarConfig[] = [...Array(3)].map((_, i) => ({
      id: i,
      delay: i * 5 + Math.random() * 3,
      x: 10 + Math.random() * 60,
      y: 5 + Math.random() * 40,
      repeatDelay: 10 + Math.random() * 8,
    }))

    setStars(generatedStars)
    setShootingStars(generatedShootingStars)
  }, [])

  return (
    <>
      {/* Deep space background */}
      <div className="absolute inset-0 bg-[#030308]" />

      {/* Galaxy gradient base - inspired by Nairi landing */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 50%, rgba(10, 10, 25, 0.9) 0%, transparent 70%),
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(0, 201, 200, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 80% 30%, rgba(224, 82, 160, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 30% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Nebula clouds - Nairi brand colors */}
      <NebulaCloud color="rgba(0, 201, 200, 0.12)" x={20} y={35} size={700} blur={100} delay={0} reduced={reduced ?? false} />
      <NebulaCloud color="rgba(224, 82, 160, 0.10)" x={80} y={55} size={600} blur={90} delay={3} reduced={reduced ?? false} />
      <NebulaCloud color="rgba(139, 92, 246, 0.08)" x={65} y={20} size={500} blur={80} delay={6} reduced={reduced ?? false} />
      <NebulaCloud color="rgba(236, 72, 153, 0.07)" x={30} y={75} size={550} blur={85} delay={9} reduced={reduced ?? false} />
      <NebulaCloud color="rgba(6, 182, 212, 0.06)" x={85} y={85} size={400} blur={70} delay={12} reduced={reduced ?? false} />

      {/* Stars */}
      {stars.map((star) => (
        <Star key={star.id} {...star} reduced={reduced ?? false} />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((star) => (
        <ShootingStar
          key={star.id}
          delay={star.delay}
          x={star.x}
          y={star.y}
          repeatDelay={star.repeatDelay}
          reduced={reduced ?? false}
        />
      ))}

      {/* Orbiting particles around the main navigation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <OrbitingParticle
          radius={orbitRadius + 110}
          duration={30}
          size={3}
          color="rgba(0, 201, 200, 0.7)"
          startAngle={0}
          reduced={reduced ?? false}
        />
        <OrbitingParticle
          radius={orbitRadius + 110}
          duration={30}
          size={2}
          color="rgba(224, 82, 160, 0.6)"
          startAngle={180}
          reduced={reduced ?? false}
        />
        <OrbitingParticle
          radius={orbitRadius + 150}
          duration={40}
          size={2}
          color="rgba(139, 92, 246, 0.5)"
          startAngle={90}
          reduced={reduced ?? false}
        />
        <OrbitingParticle
          radius={orbitRadius + 150}
          duration={40}
          size={2}
          color="rgba(6, 182, 212, 0.5)"
          startAngle={270}
          reduced={reduced ?? false}
        />
      </div>

      {/* Corner decorations */}
      <CornerDecorations reduced={reduced ?? false} />

      {/* Central glow behind navigation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.div
          className="rounded-full"
          style={{
            width: orbitRadius * 2 + 250,
            height: orbitRadius * 2 + 250,
            background: `
              radial-gradient(circle,
                rgba(0, 201, 200, 0.08) 0%,
                rgba(224, 82, 160, 0.05) 30%,
                rgba(139, 92, 246, 0.03) 50%,
                transparent 70%
              )
            `,
          }}
          animate={reduced ? { scale: 1, opacity: 0.85 } : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: reduced ? 0 : 6, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Top and bottom fade for depth */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#030308] via-[#030308]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030308] via-[#030308]/50 to-transparent pointer-events-none" />
    </>
  )
}
