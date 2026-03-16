/**
 * Shared motion primitives and reduced-motion support.
 * Use with Framer Motion; CSS animations already respect prefers-reduced-motion in globals.css.
 */

export { useReducedMotion } from "framer-motion"

/** Durations (ms) aligned with CSS tokens: --duration-fast 150, --duration-normal 250, --duration-slow 350 */
export const MOTION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const

/** Easing aligned with CSS --ease-default */
export const MOTION_EASE = [0.4, 0, 0.2, 1] as const

/** Framer Motion transition using design tokens */
export function getTransition(reduced: boolean | null, options?: { duration?: number; delay?: number }) {
  if (reduced) return { duration: 0, delay: 0 }
  return {
    duration: (options?.duration ?? MOTION_DURATION.normal) / 1000,
    delay: (options?.delay ?? 0) / 1000,
    ease: MOTION_EASE,
  }
}

/** Shared entrance variants (use with motion components). Respect reduced motion by passing reduced from useReducedMotion(). */
export function getEntranceVariants(reduced: boolean | null) {
  const t = getTransition(reduced, { duration: MOTION_DURATION.normal })
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 },
    }
  }
  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: t,
    },
    slideUp: {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: t,
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
      transition: t,
    },
  }
}

/** Stagger delay (ms) for list items; use with transition.delay in Framer Motion */
export function staggerDelay(index: number, stepMs = 40) {
  return index * stepMs
}
