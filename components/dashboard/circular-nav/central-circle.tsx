"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { CenterAvatar3D } from "./center-avatar-3d";

interface CentralCircleProps {
  size?: number;
  onClick?: () => void;
  onHoverChange?: (position: { x: number; y: number } | null) => void;
  onNodeHover?: (position: { x: number; y: number } | null) => void;
}

export function CentralCircle({ size = 120, onClick, onHoverChange, onNodeHover }: CentralCircleProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/dashboard");
    }
  };

  const handleNodeHover = useCallback((position: { x: number; y: number } | null) => {
    setHoveredNodePosition(position);
    if (onNodeHover) {
      onNodeHover(position);
    }
  }, [onNodeHover]);

  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(hoveredNodePosition);
    }
  }, [hoveredNodePosition, onHoverChange]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-block",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          backgroundColor: "#0a0a0f",
          overflow: "hidden",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.5} />
          <pointLight position={[-5, -5, 5]} intensity={0.3} color="#00c9c8" />
          <Suspense fallback={null}>
            <CenterAvatar3D size={size} hoveredNodePosition={hoveredNodePosition} />
          </Suspense>
        </Canvas>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#00e5ff",
          fontFamily: '"Orbitron", sans-serif',
          fontSize: "14px",
          fontWeight: "600",
          letterSpacing: "0.5px",
          pointerEvents: "none",
        }}
      >
        {t.nav.dashboard.toUpperCase()}
      </div>
    </div>
  );
}

export { CentralCircle as CentralCircleBase };
export type { CentralCircleProps };
