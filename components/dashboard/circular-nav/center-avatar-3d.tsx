"use client";

import { useRef, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface CenterAvatar3DProps {
  size?: number;
  hoveredNodePosition?: { x: number; y: number } | null;
}

function AvatarModel({ size, hoveredNodePosition }: { size: number; hoveredNodePosition: { x: number; y: number } | null }) {
  const { scene } = useGLTF("/models/nav-avatar.glb");
  const rotationRef = useRef<THREE.Group>(null);
  const scaleRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
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
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          materialRef.current = mat;
          mat.emissive = new THREE.Color(0x111111);
          mat.emissiveIntensity = 0.3;
        }
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
    if (!rotationRef.current || !scaleRef.current) return;

    const time = state.clock.getElapsedTime();
    const isMobile = isMobileRef.current;
    
    if (hoveredNodePosition) {
      const dx = hoveredNodePosition.x;
      const dy = hoveredNodePosition.y;
      
      const maxYaw = isMobile ? 0.2 : 0.4;
      const maxPitch = isMobile ? 0.12 : 0.25;
      
      targetRotation.current.y = THREE.MathUtils.clamp((dx / 200) * maxYaw, -maxYaw, maxYaw);
      targetRotation.current.x = THREE.MathUtils.clamp(-(dy / 200) * maxPitch, -maxPitch, maxPitch);
    } else {
      const maxYaw = isMobile ? 0.2 : 0.4;
      const maxPitch = isMobile ? 0.12 : 0.25;
      
      targetRotation.current.y = mousePos.current.x * maxYaw;
      targetRotation.current.x = -mousePos.current.y * maxPitch;
    }

    const lerpFactor = 0.2;
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * lerpFactor;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * lerpFactor;

    const swayX = Math.sin(time * 0.8) * 0.02;
    const swayY = Math.cos(time * 0.6) * 0.015;

    rotationRef.current.rotation.x = currentRotation.current.x + swayX;
    rotationRef.current.rotation.y = currentRotation.current.y + swayY;

    const breathScale = 1 + Math.sin(time * 1.5) * 0.02;
    scaleRef.current.scale.set(breathScale, breathScale, breathScale);

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
    }
  });

  const scale = (size / 100) * 1.5;

  return (
    <group ref={scaleRef} scale={[scale, scale, scale]}>
      <group ref={rotationRef} rotation={[0, Math.PI, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export const CenterAvatar3D = memo(function CenterAvatar3D({ size = 120, hoveredNodePosition }: CenterAvatar3DProps) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 2.5], fov: 50 }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-3, -3, 3]} intensity={0.5} color="#00c9c8" />
      <pointLight position={[0, 0, 2]} intensity={0.8} color="#e052a0" />
      <Environment preset="city" />
      <AvatarModel size={size} hoveredNodePosition={hoveredNodePosition} />
    </Canvas>
  );
});
