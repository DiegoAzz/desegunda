'use client';

import React, { useState } from 'react';

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fill?: boolean;
}

export default function SafeImage({
  src,
  alt = '',
  className = '',
  fill = false,
}: SafeImageProps) {
  const initialSrc = src && src.trim().length > 0 ? src : '/placeholder.svg';
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== '/placeholder.svg') {
          setCurrentSrc('/placeholder.svg');
        }
      }}
      className={`${className} ${fill ? 'w-full h-full object-cover absolute inset-0' : ''}`}
      loading="lazy"
    />
  );
}
