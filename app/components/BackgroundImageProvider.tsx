'use client';

import { useEffect, useState, useCallback } from 'react';

interface BackgroundImageProviderProps {
  children: React.ReactNode;
}

const BRAIDING_IMAGES = [
  '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Hero_Background_Imag.png',
  '/images/braiding-styles/gemini-3-pro-image-preview-2k_b_Hero_Background_Imag.png',
  '/images/braiding-styles/gpt-image-1.5-high-fidelity_a_Braider_Working_Imag.png',
  '/images/braiding-styles/b_Professional_photo_o.png',
  '/images/braiding-styles/b_Long_knotless_braids.png',
];

export function BackgroundImageProvider({ children }: BackgroundImageProviderProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rotate background images every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % BRAIDING_IMAGES.length);
        setIsTransitioning(false);
      }, 500);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const currentImage = BRAIDING_IMAGES[currentImageIndex];

  return (
    <div className="relative min-h-screen">
      {/* Background Image Layer */}
      <div
        className={`fixed inset-0 z-0 transition-opacity duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `url('${currentImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Color Overlay with Gradient */}
      <div className="fixed inset-0 z-1 bg-gradient-to-br from-primary-900/70 via-primary-800/60 to-accent-900/70" />

      {/* Animated Gradient Overlay */}
      <div
        className="fixed inset-0 z-2 opacity-30 animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(236, 72, 153, 0.3) 50%, rgba(59, 130, 246, 0.3) 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
