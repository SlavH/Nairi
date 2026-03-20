"use client";

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n/context';

interface CentralCircleProps {
  size?: number;
  onClick?: () => void;
}

export function CentralCircle({ size = 120, onClick }: CentralCircleProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // normalized -1 to 1
  const [breathScale, setBreathScale] = useState(1);
  const [idleEyeOffset, setIdleEyeOffset] = useState({ x: 0, y: 0 });
  const [glowIntensity, setGlowIntensity] = useState(0.3); // fixed initial value for SSR

  // Eye movement parameters
  const maxEyeOffset = 0.15; // in normalized coordinates
  // Glow parameters
  const maxGlowOffset = 0.1; // in normalized coordinates

  // Initialize mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const element = containerRef.current;
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      if (!rect) return;
      
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = -(e.clientY - rect.top) / rect.height * 2 + 1;
      
      setMousePos({ x, y });
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Breathing and idle eye movement
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathScale(prev => (prev === 1 ? 1.03 : 1));
    }, 3000);
    
    const idleEyeInterval = setInterval(() => {
      // Generate small random offset for idle eye movement
      setIdleEyeOffset({
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2
      });
    }, 5000);
    
    return () => {
      clearInterval(breathInterval);
      clearInterval(idleEyeInterval);
    };
  }, []);

  // Glow intensity animation
  useEffect(() => {
    const glowInterval = setInterval(() => {
      setGlowIntensity(Math.sin(Date.now() * 0.005) * 0.2 + 0.3);
    }, 50); // Update every 50ms for a smooth pulse
    
    return () => clearInterval(glowInterval);
  }, []);

  // Avatar click handler
  const handleAvatarClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/dashboard');
    }
  };

  // Calculate glow center and intensity
  const glowCenterX = `${50 + mousePos.x * maxGlowOffset * 50}%`;
  const glowCenterY = `${50 + mousePos.y * maxGlowOffset * 50}%`;

  // Calculate eye positions
  const getEyeTransform = (baseX: number, baseY: number, offsetX: number, offsetY: number) => {
    // Convert normalized offset to pixels: multiply by (size/2) because the eye is at the center and we want to move it by half the size max
    const px = offsetX * (size / 2);
    const py = offsetY * (size / 2);
    // The eye's own box is at 50%,50% of the avatar, so we first move to the center of the eye's box, then by the offset
    return `translate(-50%, -50%) translate(${px}px, ${py}px)`;
  };

  // Use mouse position for eye target (we don't have node hover input in this component yet, so we always use mouse position)
  let targetX = mousePos.x * maxEyeOffset;
  let targetY = mousePos.y * maxEyeOffset;
  
  // Add idle eye offset
  targetX += idleEyeOffset.x;
  targetY += idleEyeOffset.y;
  
  // Eye transforms
  const eyeLeftTransform = getEyeTransform(-0.08, 0.05, targetX, targetY);
  const eyeRightTransform = getEyeTransform(0.08, 0.05, targetX, targetY);

  return (
    <div
      ref={containerRef}
      onClick={handleAvatarClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'inline-block',
        transform: `scale(${breathScale})`,
      } as React.CSSProperties}
    >
      {/* Glow layer */}
      <div 
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at ${glowCenterX} ${glowCenterY}, rgba(0, 229, 255, 0.4) 0%, transparent 70%)`,
          opacity: glowIntensity,
          pointerEvents: 'none',
        } as React.CSSProperties}
      />
      
      {/* Head/Sphere base */}
      <div 
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#0a0a0f',
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {/* Hair flow - using an SVG with animation */}
        <div 
          style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          } as React.CSSProperties}
        >
          <svg 
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              height: '100%',
            } as React.CSSProperties}
          >
            <path 
              d="M50,10 
                 C40,10 30,30 30,50 
                 C30,70 40,80 50,80 
                 C60,80 70,70 70,50 
                 C70,30 60,10 50,10 Z"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="4"
              opacity="0.8"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="20s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
        
        {/* Eyes container */}
        <div>
          {/* Left eye */}
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size * 0.1}px`,
              height: `${size * 0.1}px`,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              transform: eyeLeftTransform,
            } as React.CSSProperties}
          />
          
          {/* Right eye */}
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size * 0.1}px`,
              height: `${size * 0.1}px`,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              transform: eyeRightTransform,
            } as React.CSSProperties}
          />
          
          {/* Eye pupils */}
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size * 0.05}px`,
              height: `${size * 0.05}px`,
              backgroundColor: '#000000',
              borderRadius: '50%',
              transform: `translate(-50%, -50%) translateX(-${size * 0.025}px)`,
            } as React.CSSProperties}
          />
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size * 0.05}px`,
              height: `${size * 0.05}px`,
              backgroundColor: '#000000',
              borderRadius: '50%',
              transform: `translate(-50%, -50%) translateX(${size * 0.025}px)`,
            } as React.CSSProperties}
          />
        </div>
      </div>
      
      {/* Fallback label for accessibility */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#00e5ff',
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          pointerEvents: 'none'
        } as React.CSSProperties}
      >
        {t.nav.dashboard.toUpperCase()}
      </div>
    </div>
  );
}