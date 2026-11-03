'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButton({
  title,
  text = 'Mira este artículo en LO TENGO',
  url,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        // Fallback
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-base flex items-center justify-center space-x-2 transition-colors active:scale-[0.98] ${className}`}
    >
      <span>{copied ? '✓' : '↗'}</span>
      <span>{copied ? '¡ENLACE COPIADO!' : 'COMPARTIR'}</span>
    </button>
  );
}
