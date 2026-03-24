"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { VideoCursorAvatarTracer } from "@/components/video-cursor-avatar-tracer";

interface CentralCircleProps {
  size?: number;
  onClick?: () => void;
}

export function CentralCircle({ size = 120, onClick }: CentralCircleProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/dashboard");
    }
  };

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
        borderRadius: "50%",
        padding: "3px",
        background: "linear-gradient(135deg, #00c9c8 0%, #8b5cf6 50%, #e052a0 100%)",
        boxShadow: "0 0 20px rgba(0, 201, 200, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)",
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
        <VideoCursorAvatarTracer
          src="/avatar.mp4"
          className="w-full h-full"
          gridSize={4}
          videoDuration={8}
          lerpFactor={0.08}
        />
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
