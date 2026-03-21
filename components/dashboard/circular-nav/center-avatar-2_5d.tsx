"use client";

import { useRef, useEffect, useCallback, memo } from "react";

interface LayerConfig {
  name: string;
  src: string;
  parallaxX: number;
  parallaxY: number;
  hairResponse?: number;
  hairOvershoot?: number;
}

const LAYER_CONFIGS: LayerConfig[] = [
  { name: "aura_back", src: "/avatar/avatar_aura_back.png", parallaxX: 0.02, parallaxY: 0.015, hairResponse: 0.1 },
  { name: "hair_back", src: "/avatar/avatar_hair_back.png", parallaxX: 0.12, parallaxY: 0.08, hairResponse: 0.35 },
  { name: "head_base", src: "/avatar/avatar_head_base.png", parallaxX: 0.08, parallaxY: 0.05 },
  { name: "face_shadow_soft", src: "/avatar/avatar_face_shadow_soft.png", parallaxX: 0.06, parallaxY: 0.04 },
  { name: "hair_front", src: "/avatar/avatar_hair_front.png", parallaxX: 0.18, parallaxY: 0.12, hairResponse: 0.55 },
  { name: "hair_front_strands", src: "/avatar/avatar_hair_front_strands.png", parallaxX: 0.25, parallaxY: 0.18, hairResponse: 0.75, hairOvershoot: 1.15 },
  { name: "eyes_glow", src: "/avatar/avatar_eyes_glow.png", parallaxX: 0.1, parallaxY: 0.06 },
  { name: "directional_glow", src: "/avatar/avatar_directional_glow.png", parallaxX: 0.2, parallaxY: 0.15 },
];

interface CenterAvatar2_5DProps {
  size?: number;
  hoveredNodePosition?: { x: number; y: number } | null;
}

interface HairState {
  currentX: number;
  currentY: number;
  velocityX: number;
  velocityY: number;
}

export function CenterAvatar2_5D({ size = 120, hoveredNodePosition }: CenterAvatar2_5DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hairStatesRef = useRef<HairState[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const headRotationRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const idleTimeRef = useRef<number>(0);
  const hoverIntensityRef = useRef<number>(0);
  const eyesGlowRef = useRef<number>(1);

  const MAX_YAW = 18;
  const MAX_PITCH = 10;
  const HEAD_LERP = 0.08;
  const HAIR_MASS = 0.85;
  const HAIR_SPRING = 0.12;
  const HAIR_DAMPING = 0.88;
  const IDLE_THRESHOLD = 0.02;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mousePosRef.current = { x, y };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    hairStatesRef.current = LAYER_CONFIGS.map(() => ({
      currentX: 0,
      currentY: 0,
      velocityX: 0,
      velocityY: 0,
    }));
  }, []);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const animate = useCallback((timestamp: number) => {
    if (!containerRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 16.67, 2) : 1;
    lastTimeRef.current = timestamp;
    idleTimeRef.current += deltaTime * 0.016;

    const mouse = mousePosRef.current;
    const isMobile = window.innerWidth < 768;
    const maxYaw = isMobile ? MAX_YAW * 0.5 : MAX_YAW;
    const maxPitch = isMobile ? MAX_PITCH * 0.5 : MAX_PITCH;

    if (hoveredNodePosition) {
      targetPosRef.current = {
        x: clamp(hoveredNodePosition.x / 200, -1, 1),
        y: clamp(-hoveredNodePosition.y / 200, -1, 1),
      };
    } else {
      targetPosRef.current = { x: mouse.x, y: mouse.y };
    }

    const dx = targetPosRef.current.x - mouse.x;
    const dy = targetPosRef.current.y - mouse.y;
    const movementSpeed = Math.sqrt(dx * dx + dy * dy);

    headRotationRef.current.currentX = lerp(
      headRotationRef.current.currentX,
      targetPosRef.current.y * maxPitch,
      HEAD_LERP * deltaTime
    );
    headRotationRef.current.currentY = lerp(
      headRotationRef.current.currentY,
      targetPosRef.current.x * maxYaw,
      HEAD_LERP * deltaTime
    );

    const idleSwayX = Math.sin(idleTimeRef.current * 0.8) * 0.3;
    const idleSwayY = Math.cos(idleTimeRef.current * 0.6) * 0.2;
    const idleBreath = Math.sin(idleTimeRef.current * 1.2) * 0.015;

    const isIdle = movementSpeed < IDLE_THRESHOLD && !hoveredNodePosition;

    LAYER_CONFIGS.forEach((config, index) => {
      const layerEl = layerRefs.current[index];
      if (!layerEl) return;

      const hairState = hairStatesRef.current[index];
      const layerConfig = config;
      const response = layerConfig.hairResponse ?? 0;
      const overshoot = layerConfig.hairOvershoot ?? 1;

      const targetHairX = headRotationRef.current.currentY * response * overshoot;
      const targetHairY = headRotationRef.current.currentX * response * overshoot;

      const springX = (targetHairX - hairState.currentX) * HAIR_SPRING;
      const springY = (targetHairY - hairState.currentY) * HAIR_SPRING;

      hairState.velocityX = (hairState.velocityX + springX * deltaTime) * Math.pow(HAIR_DAMPING, deltaTime);
      hairState.velocityY = (hairState.velocityY + springY * deltaTime) * Math.pow(HAIR_DAMPING, deltaTime);

      hairState.currentX += hairState.velocityX * deltaTime;
      hairState.currentY += hairState.velocityY * deltaTime;

      let parallaxX = layerConfig.parallaxX;
      let parallaxY = layerConfig.parallaxY;

      if (isIdle) {
        parallaxX *= 0.3;
        parallaxY *= 0.3;
      }

      const layerX = (headRotationRef.current.currentY + hairState.currentX) * parallaxX + idleSwayX * response;
      const layerY = (headRotationRef.current.currentX + hairState.currentY) * parallaxY + idleSwayY * response;

      const scale = 1 + idleBreath * (1 - response * 0.5);

      layerEl.style.transform = `translate(${layerX}px, ${layerY}px) scale(${scale})`;

      if (layerConfig.name === "directional_glow") {
        const glowX = mouse.x * 5;
        const glowY = mouse.y * 5;
        layerEl.style.transform = `translate(${glowX}px, ${glowY}px) scale(${scale})`;
      }

      if (layerConfig.name === "eyes_glow") {
        const centerDist = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
        const targetIntensity = 1 + (1 - centerDist) * 0.3;
        hoverIntensityRef.current = lerp(hoverIntensityRef.current, targetIntensity, 0.05);
        const pulse = Math.sin(idleTimeRef.current * 3) * 0.1;
        const intensity = hoverIntensityRef.current + pulse;
        layerEl.style.opacity = String(clamp(intensity, 0.8, 1.3));
      }
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [hoveredNodePosition]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const scale = (size / 100) * 1.5;

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: scale * 100,
          height: scale * 100,
          transform: `scale(${scale / 1.5})`,
          transformOrigin: "center center",
        }}
      >
        {LAYER_CONFIGS.map((config, index) => (
          <div
            key={config.name}
            ref={(el) => { layerRefs.current[index] = el; }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              willChange: "transform",
            }}
          >
            <img
              src={config.src}
              alt={config.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const CenterAvatar2_5DMemo = memo(CenterAvatar2_5D);
