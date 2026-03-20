"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface CenterAvatar3DProps {
  size?: number;
  hoveredNodePosition?: { x: number; y: number } | null;
}

export function CenterAvatar3D({ size = 120, hoveredNodePosition }: CenterAvatar3DProps) {
  const { scene } = useGLTF("/models/nav-avatar.glb");
  const rotationRef = useRef<THREE.Group>(null);
  const positionRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  const currentRotation = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!rotationRef.current) return;

    const time = state.clock.getElapsedTime();
    
    if (hoveredNodePosition) {
      const dx = hoveredNodePosition.x;
      const dy = hoveredNodePosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const maxYaw = isMobile ? 0.15 : 0.3;
        const maxPitch = isMobile ? 0.09 : 0.18;
        
        targetRotation.current.y = THREE.MathUtils.clamp((dx / 200) * maxYaw, -maxYaw, maxYaw);
        targetRotation.current.x = THREE.MathUtils.clamp(-(dy / 200) * maxPitch, -maxPitch, maxPitch);
      }
    } else {
      const maxYaw = isMobile ? 0.15 : 0.3;
      const maxPitch = isMobile ? 0.09 : 0.18;
      
      targetRotation.current.y = mousePos.current.x * maxYaw;
      targetRotation.current.x = -mousePos.current.y * maxPitch;
    }

    const lerpFactor = 0.05;
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * lerpFactor;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * lerpFactor;

    const idleX = Math.sin(time * 0.5) * 0.015;
    const idleY = Math.sin(time * 0.3) * 0.01;

    rotationRef.current.rotation.x = currentRotation.current.x + idleX;
    rotationRef.current.rotation.y = currentRotation.current.y + idleY;

    if (positionRef.current) {
      const floatY = Math.sin(time * 0.8) * 2;
      positionRef.current.position.y = floatY;
    }
  });

  const scale = (size / 100) * 0.8;

  return (
    <group ref={positionRef} scale={[scale, scale, scale]}>
      <group ref={rotationRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/nav-avatar.glb");
