"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface VideoCursorAvatarTracerProps {
  src: string;
  className?: string;
  gridSize?: number;
  videoDuration?: number;
  lerpFactor?: number;
  timeOffset?: number;
}

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function VideoCursorAvatarTracer({
  src,
  className = "",
  gridSize = 4,
  videoDuration = 8,
  lerpFactor = 0.08,
  timeOffset = 0,
}: VideoCursorAvatarTracerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(timeOffset);
  const targetTimeRef = useRef<number>(timeOffset);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const calculateTargetTime = useCallback(
    (normalizedX: number, normalizedY: number): number => {
      const xIndex = Math.floor(normalizedX * (gridSize - 1));
      const yIndex = Math.floor(normalizedY * (gridSize - 1));
      const gridIndex = yIndex * gridSize + xIndex;
      const timePerGrid = videoDuration / (gridSize * gridSize);
      return timeOffset + gridIndex * timePerGrid;
    },
    [gridSize, videoDuration, timeOffset]
  );

  const animate = useCallback(() => {
    if (!videoRef.current) return;

    const currentTime = currentTimeRef.current;
    const targetTime = targetTimeRef.current;

    if (Math.abs(currentTime - targetTime) > 0.001) {
      const newTime = lerp(currentTime, targetTime, lerpFactor);
      currentTimeRef.current = newTime;
      videoRef.current.currentTime = newTime;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [lerpFactor]);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const normalizedX = clamp((clientX - rect.left) / rect.width, 0, 1);
      const normalizedY = clamp((clientY - rect.top) / rect.height, 0, 1);

      targetTimeRef.current = calculateTargetTime(normalizedX, normalizedY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        handleMove(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    const container = containerRef.current;

    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [calculateTargetTime]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeOffset;
      currentTimeRef.current = timeOffset;
      targetTimeRef.current = timeOffset;
    }
  }, [timeOffset]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeOffset;
      currentTimeRef.current = timeOffset;
      setIsLoaded(true);
    }
  };

  const handleError = () => {
    setHasError(true);
    setErrorMessage("Failed to load video. Please check the source and try again.");
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ cursor: "none" }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        loop
        src={src}
        className="absolute inset-0 w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        aria-label="Interactive video avatar that tracks cursor movement"
      />

      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-pulse text-muted-foreground">
            Loading avatar...
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center text-destructive p-4">
            <p className="font-medium">Error Loading Video</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {!hasError && (
        <div
          className="pointer-events-none absolute w-4 h-4 rounded-full bg-primary/50 blur-sm"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
}

export default VideoCursorAvatarTracer;
