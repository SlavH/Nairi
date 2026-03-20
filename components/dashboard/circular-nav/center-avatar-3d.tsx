"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface CenterAvatar3DProps {
  size?: number;
  hoveredNodePosition?: { x: number; y: number } | null;
}

export function CenterAvatar3D({ size = 120, hoveredNodePosition }: CenterAvatar3DProps) {
  const { scene } = useGLTF("/models/nav-avatar.glb");
  const rotationRef = useRef<THREE.Group>(null);
  
  const currentRotation = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scene]);

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
    const isMobile = isMobileRef.current;
    
    if (hoveredNodePosition) {
      const dx = hoveredNodePosition.x;
      const dy = hoveredNodePosition.y;
      
      const maxYaw = isMobile ? 0.15 : 0.3;
      const maxPitch = isMobile ? 0.09 : 0.18;
      
      targetRotation.current.y = THREE.MathUtils.clamp((dx / 200) * maxYaw, -maxYaw, maxYaw);
      targetRotation.current.x = THREE.MathUtils.clamp(-(dy / 200) * maxPitch, -maxPitch, maxPitch);
    } else {
      const maxYaw = isMobile ? 0.15 : 0.3;
      const maxPitch = isMobile ? 0.09 : 0.18;
      
      targetRotation.current.y = mousePos.current.x * maxYaw;
      targetRotation.current.x = -mousePos.current.y * maxPitch;
    }

    const lerpFactor = 0.08;
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * lerpFactor;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * lerpFactor;

    const idleX = Math.sin(time * 0.5) * 0.008;
    const idleY = Math.sin(time * 0.3) * 0.005;

    rotationRef.current.rotation.x = currentRotation.current.x + idleX;
    rotationRef.current.rotation.y = currentRotation.current.y + idleY;
  });

  const scale = (size / 100) * 1.2;

  return (
    <group scale={[scale, scale, scale]}>
      <group ref={rotationRef} rotation={[0, Math.PI, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/nav-avatar.glb");
