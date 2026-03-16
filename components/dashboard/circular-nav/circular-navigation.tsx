"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import {
  type LucideIcon,
  Store,
  Sparkles,
  FolderOpen,
  User,
  UserCircle,
  Settings,
  CreditCard,
  LogOut,
  Globe,
  Presentation,
  MessageSquare,
  Atom,
  GraduationCap,
  GitBranch,
  Network,
  Activity,
  Shield,
  Bell,
  Zap,
  Gift,
  Plus,
  Users,
  Building2,
  FolderGit2,
  Star,
  Heart,
  Bookmark,
  Link2,
  Home,
  FileText,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { CentralCircle } from "./central-circle"
import { NavCircle } from "./nav-circle"
import { SubCircle } from "./sub-circle"
import { SubCircleLines } from "./sub-circle-lines"
import { BackgroundEffects } from "./background-effects"
import { ConnectionLines } from "./connection-lines"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CUSTOM_CIRCLES_STORAGE_KEY = "nairi_custom_nav_circles"

const ICON_OPTIONS: { value: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: "star", icon: Star, label: "Star" },
  { value: "heart", icon: Heart, label: "Heart" },
  { value: "bookmark", icon: Bookmark, label: "Bookmark" },
  { value: "link", icon: Link2, label: "Link" },
  { value: "home", icon: Home, label: "Home" },
  { value: "globe", icon: Globe, label: "Globe" },
  { value: "file", icon: FileText, label: "File" },
  { value: "folder", icon: FolderOpen, label: "Folder" },
  { value: "sparkles", icon: Sparkles, label: "Sparkles" },
  { value: "store", icon: Store, label: "Store" },
  { value: "gift", icon: Gift, label: "Gift" },
  { value: "zap", icon: Zap, label: "Zap" },
]

type CustomCircleConfig = {
  id: string
  iconKey: string
  subcirclesCount: number
  color: string
  link: string
  label?: string
}

// Configuration constants (orbit radius sized so nav circles never overlap: min center distance >= navSize + gap)
const ORBIT_RADIUS = 200
const MAIN_CIRCLE_SIZE = 130
const NAV_CIRCLE_SIZE = 85
const SUB_CIRCLE_SIZE = 58
const SUB_CIRCLE_RADIUS = 100 // Slightly larger so sub-circles don't overlap main orbit
const MIN_CIRCLE_GAP = 12 // Minimum gap between circle edges so they don't cover each other

// Sub-circle configs: items only (positions are computed on parent's side as top/down/right)
function getUserSubCircles(t: { nav: { profile: string; settings: string; billing: string; logout: string } }) {
  return [
    { icon: UserCircle, label: t.nav.profile, href: "/dashboard/profile" },
    { icon: Settings, label: t.nav.settings, href: "/dashboard/settings" },
    { icon: CreditCard, label: t.nav.billing, href: "/dashboard/billing" },
    { icon: LogOut, label: t.nav.logout, isLogout: true },
  ]
}
function getAiGenerationsSubCircles(t: { nav: { website: string; slides: string; chat: string; simulate: string } }) {
  return [
    { icon: Globe, label: t.nav.website, href: "/builder-v2" },
    { icon: Presentation, label: t.nav.slides, href: "/presentations" },
    { icon: MessageSquare, label: t.nav.chat, href: "/chat" },
    { icon: Atom, label: t.nav.simulate, href: "/simulations" },
  ]
}
function getDiscoverSubCircles(t: { nav: { learn: string; flow: string; knowledge: string } }) {
  return [
    { icon: GraduationCap, label: t.nav.learn, href: "/learn" },
    { icon: GitBranch, label: t.nav.flow, href: "/flow" },
    { icon: Network, label: t.nav.knowledge, href: "/knowledge" },
  ]
}
function getActivitySubCircles(t: { nav: { activity: string; traces: string; notifications: string; credits: string; earn: string } }) {
  return [
    { icon: Activity, label: t.nav.activity, href: "/dashboard/activity" },
    { icon: Shield, label: t.nav.traces, href: "/dashboard/traces" },
    { icon: Bell, label: t.nav.notifications, href: "/dashboard/notifications" },
    { icon: Zap, label: t.nav.credits, href: "/dashboard/credits" },
    { icon: Gift, label: t.nav.earn, href: "/dashboard/earn" },
  ]
}
function getWorkspaceSubCircles(t: { nav: { creations: string; workspace: string } }) {
  return [
    { icon: FolderOpen, label: t.nav.creations, href: "/dashboard/creations" },
    { icon: FolderOpen, label: t.nav.workspace, href: "/workspace" },
  ]
}
function getCommunitySubCircles(t: { nav: { projects: string; people: string; companies: string } }) {
  return [
    { icon: FolderGit2, label: t.nav.projects, href: "/community/projects" },
    { icon: Users, label: t.nav.people, href: "/community/people" },
    { icon: Building2, label: t.nav.companies, href: "/community/companies" },
  ]
}

// Get position for nav circles (cardinal + diagonal)
const getNavPosition = (position: string, radius: number) => {
  const r = radius * 0.707
  switch (position) {
    case "top": return { x: 0, y: -radius }
    case "top-right": return { x: r, y: -r }
    case "right": return { x: radius, y: 0 }
    case "bottom-right": return { x: r, y: r }
    case "bottom": return { x: 0, y: radius }
    case "bottom-left": return { x: -r, y: r }
    case "left": return { x: -radius, y: 0 }
    case "top-left": return { x: -r, y: -r }
    default: return { x: 0, y: 0 }
  }
}

type CircleOccupied = { x: number; y: number; radius: number }

function overlaps(candidate: { x: number; y: number }, radius: number, occupied: CircleOccupied[]): boolean {
  for (const c of occupied) {
    const dx = candidate.x - c.x
    const dy = candidate.y - c.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const minDist = radius + c.radius + MIN_CIRCLE_GAP
    if (dist < minDist) return true
  }
  return false
}

function findNonOverlappingPosition(
  preferred: { x: number; y: number },
  radius: number,
  occupied: CircleOccupied[],
  parentXY: { x: number; y: number }
): { x: number; y: number } {
  if (!overlaps(preferred, radius, occupied)) return preferred
  const dx = preferred.x - parentXY.x
  const dy = preferred.y - parentXY.y
  const len = Math.sqrt(dx * dx + dy * dy) || radius * 2
  const step = radius * 2 + MIN_CIRCLE_GAP
  for (let scale = 1.2; scale <= 4; scale += 0.3) {
    const candidate = {
      x: parentXY.x + (dx / len) * (len * scale),
      y: parentXY.y + (dy / len) * (len * scale),
    }
    if (!overlaps(candidate, radius, occupied)) return candidate
  }
  const searchRadius = len * 1.5 + step * 3
  for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
    const candidate = {
      x: parentXY.x + Math.cos(angle) * searchRadius,
      y: parentXY.y + Math.sin(angle) * searchRadius,
    }
    if (!overlaps(candidate, radius, occupied)) return candidate
  }
  return preferred
}

const SUB_SPACING = 75

/** Preferred layout: main on parent's side, then top/right/bottom/diagonals. Returns positions only (no collision check). */
function getPreferredSubPositions(
  parentPosition: string,
  parentXY: { x: number; y: number },
  subRadius: number,
  count: number,
  circleSize: number
): { x: number; y: number }[] {
  const minStep = circleSize + MIN_CIRCLE_GAP
  const d = Math.max(subRadius + SUB_SPACING, minStep)
  const pos = parentXY
  const out: { x: number; y: number }[] = []
  const mainOffsets: Record<string, { x: number; y: number }> = {
    right: { x: d, y: 0 },
    left: { x: -d, y: 0 },
    top: { x: 0, y: -d },
    bottom: { x: 0, y: d },
    "top-right": { x: d * 0.7, y: -d * 0.7 },
    "bottom-right": { x: d * 0.7, y: d * 0.7 },
    "bottom-left": { x: -d * 0.7, y: d * 0.7 },
    "top-left": { x: -d * 0.7, y: -d * 0.7 },
  }
  const off = mainOffsets[parentPosition] ?? { x: d, y: 0 }
  const main = { x: pos.x + off.x, y: pos.y + off.y }
  const rightOfMain = { x: main.x + off.x * 0.8, y: main.y + off.y * 0.8 }
  const topOfMain = { x: main.x, y: main.y - d }
  const bottomOfMain = { x: main.x, y: main.y + d }
  const rightAdjusted =
    off.x < 0
      ? { x: main.x - d * 0.8, y: main.y }
      : off.y !== 0
        ? { x: main.x + (off.x > 0 ? 1 : -1) * d * 0.8, y: main.y }
        : rightOfMain
  const diagD = Math.max(d, minStep / 0.65)
  const topRightSafe = off.x < 0
    ? { x: main.x - diagD * 0.65, y: main.y - diagD * 0.65 }
    : { x: main.x + diagD * 0.65, y: main.y - diagD * 0.65 }
  const bottomRightSafe = off.x < 0
    ? { x: main.x - diagD * 0.65, y: main.y + diagD * 0.65 }
    : { x: main.x + diagD * 0.65, y: main.y + diagD * 0.65 }
  out.push(main)
  out.push(topOfMain, rightAdjusted, bottomOfMain)
  if (count >= 4) out.push(topRightSafe)
  if (count >= 5) out.push(bottomRightSafe)
  return out.slice(0, count)
}

/** Sub-circle positions that avoid overlapping any circle in occupied. Updates occupied as circles are placed. */
function getSubCirclePositionsAvoiding(
  occupied: CircleOccupied[],
  parentPosition: string,
  parentXY: { x: number; y: number },
  subRadius: number,
  count: number,
  circleSize: number
): { x: number; y: number }[] {
  const preferred = getPreferredSubPositions(parentPosition, parentXY, subRadius, count, circleSize)
  const radius = circleSize / 2
  const result: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const pref = preferred[i] ?? preferred[0]
    const pos = findNonOverlappingPosition(pref, radius, occupied, parentXY)
    result.push(pos)
    occupied.push({ x: pos.x, y: pos.y, radius })
  }
  return result
}

/** All circles that are always present: central + nav (top-left, top, top-right, right, bottom-right, bottom, bottom-left, left). */
function getInitialOccupied(orbitRadius: number, mainSize: number, navSize: number): CircleOccupied[] {
  const r = orbitRadius * 0.707
  const navRadius = navSize / 2
  return [
    { x: 0, y: 0, radius: mainSize / 2 },
    { x: -r, y: -r, radius: navRadius },
    { x: 0, y: -orbitRadius, radius: navRadius },
    { x: r, y: -r, radius: navRadius },
    { x: orbitRadius, y: 0, radius: navRadius },
    { x: r, y: r, radius: navRadius },
    { x: 0, y: orbitRadius, radius: navRadius },
    { x: -r, y: r, radius: navRadius },
    { x: -orbitRadius, y: 0, radius: navRadius },
  ]
}

type ExpandedGroup = "user" | "ai" | "discover" | "activity" | "workspace" | "community" | "custom"

function loadCustomCircles(): CustomCircleConfig[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_CIRCLES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomCircleConfig[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CircularNavigation() {
  const router = useRouter()
  const { t } = useTranslation()
  const [expandedGroups, setExpandedGroups] = useState<Set<ExpandedGroup>>(new Set())
  const [isMobile, setIsMobile] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const MIN_ZOOM = 0.4
  const MAX_ZOOM = 2
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [customCircleModalOpen, setCustomCircleModalOpen] = useState(false)
  const [customCircles, setCustomCircles] = useState<CustomCircleConfig[]>([])
  const [customCircleForm, setCustomCircleForm] = useState({
    iconKey: "star",
    subcirclesCount: 0,
    color: "#00c9c8",
    link: "",
    label: "Custom",
  })

  const USER_SUB_CIRCLES = getUserSubCircles(t)
  const AI_GENERATIONS_SUB_CIRCLES = getAiGenerationsSubCircles(t)
  const DISCOVER_SUB_CIRCLES = getDiscoverSubCircles(t)
  const ACTIVITY_SUB_CIRCLES = getActivitySubCircles(t)
  const WORKSPACE_SUB_CIRCLES = getWorkspaceSubCircles(t)
  const COMMUNITY_SUB_CIRCLES = getCommunitySubCircles(t)

  useEffect(() => setCustomCircles(loadCustomCircles()), [])

  // Responsive orbit radius (kept large enough so adjacent nav circles never overlap)
  const orbitRadius = isMobile ? ORBIT_RADIUS * 0.75 : ORBIT_RADIUS
  const mainSize = isMobile ? MAIN_CIRCLE_SIZE * 0.85 : MAIN_CIRCLE_SIZE
  const navSize = isMobile ? NAV_CIRCLE_SIZE * 0.85 : NAV_CIRCLE_SIZE
  const subSize = isMobile ? SUB_CIRCLE_SIZE * 0.85 : SUB_CIRCLE_SIZE
  const subRadius = isMobile ? SUB_CIRCLE_RADIUS * 0.75 : SUB_CIRCLE_RADIUS

  // Check for mobile viewport — align with md (768px) per DESIGN_SYSTEM Responsiveness
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Pan/drag handlers (map-like pushable nav) — only start pan when dragging empty space
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("button, a, [role='button']")) return
    setIsPanning(true)
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    target.setPointerCapture?.(e.pointerId)
  }, [pan.x, pan.y])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy })
  }, [isPanning])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false)
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }
  }, [isPanning])

  const handlePointerLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)))
  }, [])

  // Toggle group expansion (clicking same circle closes it; clicking another keeps both open)
  const toggleGroup = (group: ExpandedGroup) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  // Handle logout
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const saveCustomCircle = () => {
    const link = customCircleForm.link.trim() || "#"
    const config: CustomCircleConfig = {
      id: `custom-${Date.now()}`,
      iconKey: customCircleForm.iconKey,
      subcirclesCount: Math.min(5, Math.max(0, customCircleForm.subcirclesCount)),
      color: customCircleForm.color,
      link: link.startsWith("http") || link.startsWith("/") ? link : `/${link}`,
      label: customCircleForm.label || "Custom",
    }
    const next = [...customCircles, config]
    setCustomCircles(next)
    try {
      localStorage.setItem(CUSTOM_CIRCLES_STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setCustomCircleModalOpen(false)
    setCustomCircleForm({ iconKey: "star", subcirclesCount: 0, color: "#00c9c8", link: "", label: "Custom" })
  }

  const iconByKey: Record<string, React.ComponentType<{ className?: string }>> = Object.fromEntries(
    ICON_OPTIONS.map(o => [o.value, o.icon])
  )

  // Get parent position for sub-circles
  const userPosition = getNavPosition("left", orbitRadius)
  const aiPosition = getNavPosition("right", orbitRadius)
  const discoverPosition = getNavPosition("top-right", orbitRadius)
  const activityPosition = getNavPosition("bottom-right", orbitRadius)
  const workspacePosition = getNavPosition("bottom", orbitRadius)
  const communityPosition = getNavPosition("bottom-left", orbitRadius)
  const plusPosition = getNavPosition("top-left", orbitRadius)

  // Compute sub-circle positions so each appears where no other circle is (avoid overlap)
  const positionsByGroup = useMemo(() => {
    const occupied = getInitialOccupied(orbitRadius, mainSize, navSize)
    const result: Record<string, { x: number; y: number }[]> = {}
    const circleRadius = navSize / 2

    if (expandedGroups.has("user")) {
      const copy = occupied.slice()
      result.user = getSubCirclePositionsAvoiding(copy, "left", userPosition, subRadius, USER_SUB_CIRCLES.length, navSize)
      result.user.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    if (expandedGroups.has("ai")) {
      const copy = occupied.slice()
      result.ai = getSubCirclePositionsAvoiding(copy, "right", aiPosition, subRadius, AI_GENERATIONS_SUB_CIRCLES.length, navSize)
      result.ai.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    if (expandedGroups.has("discover")) {
      const copy = occupied.slice()
      result.discover = getSubCirclePositionsAvoiding(copy, "top-right", discoverPosition, subRadius, DISCOVER_SUB_CIRCLES.length, navSize)
      result.discover.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    if (expandedGroups.has("activity")) {
      const copy = occupied.slice()
      result.activity = getSubCirclePositionsAvoiding(copy, "bottom-right", activityPosition, subRadius, ACTIVITY_SUB_CIRCLES.length, navSize)
      result.activity.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    if (expandedGroups.has("workspace")) {
      const copy = occupied.slice()
      result.workspace = getSubCirclePositionsAvoiding(copy, "bottom", workspacePosition, subRadius, WORKSPACE_SUB_CIRCLES.length, navSize)
      result.workspace.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    if (expandedGroups.has("community")) {
      const copy = occupied.slice()
      result.community = getSubCirclePositionsAvoiding(copy, "bottom-left", communityPosition, subRadius, COMMUNITY_SUB_CIRCLES.length, navSize)
      result.community.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    const customCount = customCircles.length + 1 // +1 for "Add" subcircle
    if (expandedGroups.has("custom") && customCount > 0) {
      const copy = occupied.slice()
      result.custom = getSubCirclePositionsAvoiding(copy, "top-left", plusPosition, subRadius, customCount, navSize)
      result.custom.forEach(p => occupied.push({ x: p.x, y: p.y, radius: circleRadius }))
    }
    return result
  }, [expandedGroups, orbitRadius, mainSize, navSize, subRadius, customCircles.length])

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {/* Zoom controls - fixed so they don't pan */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 shadow-lg">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground hover:bg-white/20"
          onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.25))}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground hover:bg-white/20"
          onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.25))}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Enhanced background effects (stays fixed while panning) */}
      <BackgroundEffects orbitRadius={orbitRadius} />

      {/* Pannable area: orbit rings, lines, and circles (map-like drag); zoom via wheel */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "50% 50%",
          cursor: isPanning ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      >
      {/* Orbit rings (visual guide) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {/* Inner orbit ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: orbitRadius * 2 + navSize,
            height: orbitRadius * 2 + navSize,
            border: "1px solid rgba(0, 201, 200, 0.08)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        
        {/* Outer decorative ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: orbitRadius * 2 + navSize + 60,
            height: orbitRadius * 2 + navSize + 60,
            border: "1px dashed rgba(224, 82, 160, 0.05)",
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 360 }}
          transition={{
            opacity: { duration: 1, delay: 0.3 },
            scale: { duration: 1, delay: 0.3 },
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
          }}
        />

        {/* Innermost ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: mainSize + 80,
            height: mainSize + 80,
            border: "1px solid rgba(139, 92, 246, 0.06)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        />
      </div>

      {/* Connection lines between circles */}
      <ConnectionLines orbitRadius={orbitRadius} mainSize={mainSize} />

      {/* Main navigation container (above all lines) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Central Circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CentralCircle size={mainSize} />
        </div>

        {/* Add custom circle - TOP-LEFT (opens modal or expands to show custom circles) */}
        <NavCircle
          icon={Plus}
          label="Add"
          position="top-left"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => {
            if (customCircles.length > 0) toggleGroup("custom")
            else setCustomCircleModalOpen(true)
          }}
          isActive={expandedGroups.has("custom")}
          hasSubCircles={customCircles.length > 0}
          delay={0.08}
          borderGradient="linear-gradient(135deg, #00c9c8 0%, #8b5cf6 100%)"
        />

        {/* Marketplace - TOP (simple navigation) */}
        <NavCircle
          icon={Store}
          label="Market"
          position="top"
          orbitRadius={orbitRadius}
          size={navSize}
          href="/marketplace"
          delay={0.1}
          borderGradient="linear-gradient(135deg, #00c9c8 0%, #e052a0 100%)"
        />

        {/* Discover - TOP-RIGHT (expandable: Learn, Flow, Knowledge) */}
        <NavCircle
          icon={GraduationCap}
          label="Discover"
          position="top-right"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => toggleGroup("discover")}
          isActive={expandedGroups.has("discover")}
          hasSubCircles
          delay={0.12}
          borderGradient="linear-gradient(135deg, #e052a0 0%, #8b5cf6 100%)"
        />

        {/* AI Generations - RIGHT (expandable) */}
        <NavCircle
          icon={Sparkles}
          label="Generate"
          position="right"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => toggleGroup("ai")}
          isActive={expandedGroups.has("ai")}
          hasSubCircles
          delay={0.15}
          borderGradient="linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)"
        />

        {/* Activity - BOTTOM-RIGHT (expandable: Activity, Traces, Notifications, Credits, Earn) */}
        <NavCircle
          icon={Activity}
          label="Activity"
          position="bottom-right"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => toggleGroup("activity")}
          isActive={expandedGroups.has("activity")}
          hasSubCircles
          delay={0.18}
          borderGradient="linear-gradient(135deg, #06b6d4 0%, #00c9c8 100%)"
        />

        {/* Workspace - BOTTOM (expandable: Creations, Workspace) */}
        <NavCircle
          icon={FolderOpen}
          label="Workspace"
          position="bottom"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => toggleGroup("workspace")}
          isActive={expandedGroups.has("workspace")}
          hasSubCircles
          delay={0.2}
          borderGradient="linear-gradient(135deg, #00c9c8 0%, #8b5cf6 100%)"
        />

        {/* Community - BOTTOM-LEFT (expandable: Projects, People, Companies) */}
        <NavCircle
          icon={Users}
          label="Community"
          position="bottom-left"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => toggleGroup("community")}
          isActive={expandedGroups.has("community")}
          hasSubCircles
          delay={0.22}
          borderGradient="linear-gradient(135deg, #8b5cf6 0%, #00c9c8 100%)"
        />

        {/* User - LEFT (expandable) */}
        <NavCircle
          icon={User}
          label="Account"
          position="left"
          orbitRadius={orbitRadius}
          size={navSize}
          onClick={() => toggleGroup("user")}
          isActive={expandedGroups.has("user")}
          hasSubCircles
          delay={0.25}
          borderGradient="linear-gradient(135deg, #e052a0 0%, #06b6d4 100%)"
        />

        {/* User Sub-Circles (on the left side of the clicked circle, top/down/right + lines) */}
        <AnimatePresence>
          {expandedGroups.has("user") && positionsByGroup.user && (() => {
            const positions = positionsByGroup.user
            return (
              <motion.div
                key="user"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 2 }}
              >
                <SubCircleLines parentPosition={userPosition} subPositions={positions} lineColor="#00c9c8" />
                {USER_SUB_CIRCLES.map((item, index) => (
                  <SubCircle
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    onClick={item.isLogout ? handleLogout : undefined}
                    position={positions[index]}
                    size={navSize}
                    index={index}
                    parentPosition={userPosition}
                    hideParentLine={index !== 0}
                    lineColor="#00c9c8"
                  />
                ))}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* AI Generations Sub-Circles (on the right side, top/down/right + lines) */}
        <AnimatePresence>
          {expandedGroups.has("ai") && positionsByGroup.ai && (() => {
            const positions = positionsByGroup.ai
            return (
              <motion.div
                key="ai"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 3 }}
              >
                <SubCircleLines parentPosition={aiPosition} subPositions={positions} lineColor="#00c9c8" />
                {AI_GENERATIONS_SUB_CIRCLES.map((item, index) => (
                  <SubCircle
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    position={positions[index]}
                    size={navSize}
                    index={index}
                    parentPosition={aiPosition}
                    hideParentLine={index !== 0}
                    lineColor="#00c9c8"
                  />
                ))}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Discover Sub-Circles (on top-right side, top/down/right + lines) */}
        <AnimatePresence>
          {expandedGroups.has("discover") && positionsByGroup.discover && (() => {
            const positions = positionsByGroup.discover
            return (
              <motion.div
                key="discover"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 4 }}
              >
                <SubCircleLines parentPosition={discoverPosition} subPositions={positions} lineColor="#00c9c8" />
                {DISCOVER_SUB_CIRCLES.map((item, index) => (
                  <SubCircle
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    position={positions[index]}
                    size={navSize}
                    index={index}
                    parentPosition={discoverPosition}
                    hideParentLine={index !== 0}
                    lineColor="#00c9c8"
                  />
                ))}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Activity Sub-Circles (on bottom-right side, top/down/right + lines) */}
        <AnimatePresence>
          {expandedGroups.has("activity") && positionsByGroup.activity && (() => {
            const positions = positionsByGroup.activity
            return (
              <motion.div
                key="activity"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 5 }}
              >
                <SubCircleLines parentPosition={activityPosition} subPositions={positions} lineColor="#00c9c8" />
                {ACTIVITY_SUB_CIRCLES.map((item, index) => (
                  <SubCircle
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    position={positions[index]}
                    size={navSize}
                    index={index}
                    parentPosition={activityPosition}
                    hideParentLine={index !== 0}
                    lineColor="#00c9c8"
                  />
                ))}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Workspace Sub-Circles (on bottom side, top/down/right + lines) */}
        <AnimatePresence>
          {expandedGroups.has("workspace") && positionsByGroup.workspace && (() => {
            const positions = positionsByGroup.workspace
            return (
              <motion.div
                key="workspace"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 6 }}
              >
                <SubCircleLines parentPosition={workspacePosition} subPositions={positions} lineColor="#00c9c8" />
                {WORKSPACE_SUB_CIRCLES.map((item, index) => (
                  <SubCircle
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    position={positions[index]}
                    size={navSize}
                    index={index}
                    parentPosition={workspacePosition}
                    hideParentLine={index !== 0}
                    lineColor="#00c9c8"
                  />
                ))}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Community Sub-Circles (Projects, People, Companies) */}
        <AnimatePresence>
          {expandedGroups.has("community") && positionsByGroup.community && (() => {
            const positions = positionsByGroup.community
            return (
              <motion.div
                key="community"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 7 }}
              >
                <SubCircleLines parentPosition={communityPosition} subPositions={positions} lineColor="#00c9c8" />
                {COMMUNITY_SUB_CIRCLES.map((item, index) => (
                  <SubCircle
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    position={positions[index]}
                    size={navSize}
                    index={index}
                    parentPosition={communityPosition}
                    hideParentLine={index !== 0}
                    lineColor="#00c9c8"
                  />
                ))}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Custom circles (Add + user-created circles) */}
        <AnimatePresence>
          {expandedGroups.has("custom") && positionsByGroup.custom && (() => {
            const positions = positionsByGroup.custom
            return (
              <motion.div
                key="custom"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 8 }}
              >
                <SubCircleLines parentPosition={plusPosition} subPositions={positions} lineColor="#00c9c8" />
                <SubCircle
                  key="add"
                  icon={Plus}
                  label="Add"
                  position={positions[0]}
                  size={navSize}
                  index={0}
                  parentPosition={plusPosition}
                  hideParentLine={false}
                  lineColor="#00c9c8"
                  onClick={() => setCustomCircleModalOpen(true)}
                />
                {customCircles.map((config, index) => {
                  const IconComp = iconByKey[config.iconKey] ?? Star
                  return (
                    <SubCircle
                      key={config.id}
                      icon={IconComp as LucideIcon}
                      label={config.label ?? "Custom"}
                      href={config.link}
                      position={positions[index + 1]}
                      size={navSize}
                      index={index + 1}
                      parentPosition={plusPosition}
                      hideParentLine={index !== 0}
                      lineColor={config.color}
                    />
                  )
                })}
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>
      </div>

      {/* Add Custom Circle Modal */}
      <Dialog open={customCircleModalOpen} onOpenChange={setCustomCircleModalOpen}>
        <DialogContent className="sm:max-w-md bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl text-foreground">
          <DialogHeader>
            <DialogTitle>Add custom circle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Icon</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCustomCircleForm((f) => ({ ...f, iconKey: opt.value }))}
                      className={`p-2 rounded-lg border transition-colors ${
                        customCircleForm.iconKey === opt.value
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-400"
                          : "border-white/20 bg-white/5 text-foreground hover:bg-white/10"
                      }`}
                      title={opt.label}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={customCircleForm.label}
                onChange={(e) => setCustomCircleForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Custom"
                className="mt-1 bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label>Subcircles (0–5)</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={customCircleForm.subcirclesCount}
                onChange={(e) =>
                  setCustomCircleForm((f) => ({
                    ...f,
                    subcirclesCount: Math.min(5, Math.max(0, parseInt(e.target.value, 10) || 0)),
                  }))
                }
                className="mt-1 bg-white/10 border-white/20 text-foreground"
              />
            </div>
            <div>
              <Label>Color (border & line)</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={customCircleForm.color}
                  onChange={(e) => setCustomCircleForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-white/5"
                />
                <Input
                  value={customCircleForm.color}
                  onChange={(e) => setCustomCircleForm((f) => ({ ...f, color: e.target.value }))}
                  className="flex-1 bg-white/10 border-white/20 text-foreground font-mono"
                />
              </div>
            </div>
            <div>
              <Label>Link (URL or path)</Label>
              <Input
                value={customCircleForm.link}
                onChange={(e) => setCustomCircleForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="/my-page or https://..."
                className="mt-1 bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomCircleModalOpen(false)}
              className="border-white/20 bg-white/5 text-foreground hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveCustomCircle}
              className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
            >
              Save circle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}