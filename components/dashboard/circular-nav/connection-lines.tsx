"use client"

import { motion, useReducedMotion } from "framer-motion"

interface ConnectionLinesProps {
  orbitRadius: number
  mainSize: number
}

// Curved path between two points with gradient stroke along the path
function CurvedLine({
  startX,
  startY,
  endX,
  endY,
  gradientId,
  delay = 0,
  curvature = 0.3,
  reduced = false,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  gradientId: string
  delay?: number
  curvature?: number
  reduced?: boolean
}) {
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const dx = endX - startX
  const dy = endY - startY
  const len = Math.sqrt(dx * dx + dy * dy)
  const offsetX = (-dy / len) * len * curvature
  const offsetY = (dx / len) * len * curvature
  const controlX = midX + offsetX
  const controlY = midY + offsetY
  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`

  return (
    <motion.path
      d={pathD}
      stroke={`url(#${gradientId})`}
      strokeWidth="1"
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { duration: reduced ? 0 : 1.5, delay: reduced ? 0 : delay, ease: "easeInOut" },
        opacity: { duration: reduced ? 0 : 0.5, delay: reduced ? 0 : delay },
      }}
    />
  )
}

// Animated dot traveling along a path
function TravelingDot({
  pathId,
  color,
  duration = 4,
  delay = 0,
  reduced = false,
}: {
  pathId: string
  color: string
  duration?: number
  delay?: number
  reduced?: boolean
}) {
  if (reduced) return null
  return (
    <motion.circle
      r="2"
      fill={color}
      filter={`drop-shadow(0 0 4px ${color})`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: duration,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    >
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </motion.circle>
  )
}

export function ConnectionLines({ orbitRadius, mainSize }: ConnectionLinesProps) {
  const reduced = useReducedMotion()
  const center = { x: 0, y: 0 }
  const top = { x: 0, y: -orbitRadius }
  const right = { x: orbitRadius, y: 0 }
  const bottom = { x: 0, y: orbitRadius }
  const left = { x: -orbitRadius, y: 0 }

  const viewSize = orbitRadius * 2 + 100
  const offset = viewSize / 2

  // Line endpoints for gradient along path (center→nav and nav→nav)
  const cTop = { sx: center.x, sy: center.y - mainSize / 2 - 10, ex: top.x, ey: top.y + 45 }
  const cRight = { sx: center.x + mainSize / 2 + 10, sy: center.y, ex: right.x - 45, ey: right.y }
  const cBottom = { sx: center.x, sy: center.y + mainSize / 2 + 10, ex: bottom.x, ey: bottom.y - 45 }
  const cLeft = { sx: center.x - mainSize / 2 - 10, sy: center.y, ex: left.x + 45, ey: left.y }
  const topRight = { sx: top.x + 40, sy: top.y + 20, ex: right.x - 20, ey: right.y - 40 }
  const rightBottom = { sx: right.x - 20, sy: right.y + 40, ex: bottom.x + 40, ey: bottom.y - 20 }
  const bottomLeft = { sx: bottom.x - 40, sy: bottom.y - 20, ex: left.x + 20, ey: left.y + 40 }
  const leftTop = { sx: left.x + 20, sy: left.y - 40, ex: top.x - 40, ey: top.y + 20 }

  const lineCoords = [cTop, cRight, cBottom, cLeft, topRight, rightBottom, bottomLeft, leftTop]
  const gradientPairs: [string, string][] = [
    ["rgba(0, 201, 200, 0.4)", "rgba(224, 82, 160, 0.4)"],
    ["rgba(224, 82, 160, 0.4)", "rgba(139, 92, 246, 0.4)"],
    ["rgba(6, 182, 212, 0.4)", "rgba(0, 201, 200, 0.4)"],
    ["rgba(139, 92, 246, 0.4)", "rgba(6, 182, 212, 0.4)"],
    ["rgba(0, 201, 200, 0.35)", "rgba(139, 92, 246, 0.35)"],
    ["rgba(224, 82, 160, 0.35)", "rgba(6, 182, 212, 0.35)"],
    ["rgba(6, 182, 212, 0.35)", "rgba(224, 82, 160, 0.35)"],
    ["rgba(139, 92, 246, 0.35)", "rgba(0, 201, 200, 0.35)"],
  ]

  return (
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      width={viewSize}
      height={viewSize}
      viewBox={`${-offset} ${-offset} ${viewSize} ${viewSize}`}
      style={{ overflow: "visible", zIndex: 0 }}
    >
      <defs>
        {/* Gradient along each path (start → end) */}
        {lineCoords.map((coord, i) => (
          <linearGradient
            key={i}
            id={`gradient-line-${i}`}
            gradientUnits="userSpaceOnUse"
            x1={coord.sx}
            y1={coord.sy}
            x2={coord.ex}
            y2={coord.ey}
          >
            <stop offset="0%" stopColor={gradientPairs[i][0]} />
            <stop offset="100%" stopColor={gradientPairs[i][1]} />
          </linearGradient>
        ))}

        {/* Path definitions for animateMotion */}
        <path
          id="path-center-top"
          d={`M ${center.x} ${center.y - mainSize/2 - 10} Q ${center.x - 30} ${(center.y + top.y) / 2} ${top.x} ${top.y + 45}`}
          fill="none"
        />
        <path
          id="path-center-right"
          d={`M ${center.x + mainSize/2 + 10} ${center.y} Q ${(center.x + right.x) / 2} ${center.y + 30} ${right.x - 45} ${right.y}`}
          fill="none"
        />
        <path
          id="path-center-bottom"
          d={`M ${center.x} ${center.y + mainSize/2 + 10} Q ${center.x + 30} ${(center.y + bottom.y) / 2} ${bottom.x} ${bottom.y - 45}`}
          fill="none"
        />
        <path
          id="path-center-left"
          d={`M ${center.x - mainSize/2 - 10} ${center.y} Q ${(center.x + left.x) / 2} ${center.y - 30} ${left.x + 45} ${left.y}`}
          fill="none"
        />
        <path
          id="path-top-right"
          d={`M ${top.x + 40} ${top.y + 20} Q ${(top.x + right.x) / 2 + 40} ${(top.y + right.y) / 2 - 40} ${right.x - 20} ${right.y - 40}`}
          fill="none"
        />
        <path
          id="path-right-bottom"
          d={`M ${right.x - 20} ${right.y + 40} Q ${(right.x + bottom.x) / 2 + 40} ${(right.y + bottom.y) / 2 + 40} ${bottom.x + 40} ${bottom.y - 20}`}
          fill="none"
        />
        <path
          id="path-bottom-left"
          d={`M ${bottom.x - 40} ${bottom.y - 20} Q ${(bottom.x + left.x) / 2 - 40} ${(bottom.y + left.y) / 2 + 40} ${left.x + 20} ${left.y + 40}`}
          fill="none"
        />
        <path
          id="path-left-top"
          d={`M ${left.x + 20} ${left.y - 40} Q ${(left.x + top.x) / 2 - 40} ${(left.y + top.y) / 2 - 40} ${top.x - 40} ${top.y + 20}`}
          fill="none"
        />
      </defs>

      {/* Connection lines from center to each nav circle (gradient along path) */}
      <CurvedLine
        startX={center.x}
        startY={center.y - mainSize/2 - 10}
        endX={top.x}
        endY={top.y + 45}
        gradientId="gradient-line-0"
        delay={0.3}
        curvature={-0.15}
        reduced={reduced ?? false}
      />
      <CurvedLine
        startX={center.x + mainSize/2 + 10}
        startY={center.y}
        endX={right.x - 45}
        endY={right.y}
        gradientId="gradient-line-1"
        delay={0.4}
        curvature={0.15}
        reduced={reduced ?? false}
      />
      <CurvedLine
        startX={center.x}
        startY={center.y + mainSize/2 + 10}
        endX={bottom.x}
        endY={bottom.y - 45}
        gradientId="gradient-line-2"
        delay={0.5}
        curvature={0.15}
        reduced={reduced ?? false}
      />
      <CurvedLine
        startX={center.x - mainSize/2 - 10}
        startY={center.y}
        endX={left.x + 45}
        endY={left.y}
        gradientId="gradient-line-3"
        delay={0.6}
        curvature={-0.15}
        reduced={reduced ?? false}
      />

      {/* Connection lines between adjacent nav circles */}
      <CurvedLine
        startX={top.x + 40}
        startY={top.y + 20}
        endX={right.x - 20}
        endY={right.y - 40}
        gradientId="gradient-line-4"
        delay={0.8}
        curvature={0.25}
        reduced={reduced ?? false}
      />
      <CurvedLine
        startX={right.x - 20}
        startY={right.y + 40}
        endX={bottom.x + 40}
        endY={bottom.y - 20}
        gradientId="gradient-line-5"
        delay={0.9}
        curvature={0.25}
        reduced={reduced ?? false}
      />
      <CurvedLine
        startX={bottom.x - 40}
        startY={bottom.y - 20}
        endX={left.x + 20}
        endY={left.y + 40}
        gradientId="gradient-line-6"
        delay={1.0}
        curvature={0.25}
        reduced={reduced ?? false}
      />
      <CurvedLine
        startX={left.x + 20}
        startY={left.y - 40}
        endX={top.x - 40}
        endY={top.y + 20}
        gradientId="gradient-line-7"
        delay={1.1}
        curvature={0.25}
        reduced={reduced ?? false}
      />

      {/* Traveling dots along paths */}
      <TravelingDot pathId="path-center-top" color="rgba(0, 201, 200, 0.8)" duration={3} delay={2} reduced={reduced ?? false} />
      <TravelingDot pathId="path-center-right" color="rgba(224, 82, 160, 0.8)" duration={3} delay={2.5} reduced={reduced ?? false} />
      <TravelingDot pathId="path-center-bottom" color="rgba(6, 182, 212, 0.8)" duration={3} delay={3} reduced={reduced ?? false} />
      <TravelingDot pathId="path-center-left" color="rgba(139, 92, 246, 0.8)" duration={3} delay={3.5} reduced={reduced ?? false} />
      
      <TravelingDot pathId="path-top-right" color="rgba(0, 201, 200, 0.6)" duration={4} delay={4} reduced={reduced ?? false} />
      <TravelingDot pathId="path-right-bottom" color="rgba(224, 82, 160, 0.6)" duration={4} delay={5} reduced={reduced ?? false} />
      <TravelingDot pathId="path-bottom-left" color="rgba(6, 182, 212, 0.6)" duration={4} delay={6} reduced={reduced ?? false} />
      <TravelingDot pathId="path-left-top" color="rgba(139, 92, 246, 0.6)" duration={4} delay={7} reduced={reduced ?? false} />
    </svg>
  )
}
