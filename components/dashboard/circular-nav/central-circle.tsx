"use client";

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';

interface CentralCircleProps {
  size?: number;
  onClick?: () => void;
}

export function CentralCircle({ size = 120, onClick }: CentralCircleProps) {
  // Updated to fix Vercel build error
  const router = useRouter();
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/circle-nav-avatar.png"
          alt="Avatar"
          style={{
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      </div>
      {/* Label */}
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
        }}
      >
        {t.nav.dashboard.toUpperCase()}
      </div>
    </div>
  );
}