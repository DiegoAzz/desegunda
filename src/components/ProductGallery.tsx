'use client';

import { useState } from 'react';
import SafeImage from '@/components/SafeImage';
import { ProductCondition, ProductStatus, ProductType } from '@/lib/types';
import { ProductStatusBadge, ProductTypeBadge } from '@/components/ProductStatusBadge';

interface GalleryImage {
  id?: string;
  storagePath: string;
  altText?: string | null;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  title: string;
  type: ProductType;
  condition?: ProductCondition | null;
  status: ProductStatus;
  videoUrl?: string | null;
}

export default function ProductGallery({
  images,
  title,
  type,
  condition,
  status,
  videoUrl,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showingVideo, setShowingVideo] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const isAvailable = status === 'AVAILABLE';
  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[selectedIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showingVideo) {
      setShowingVideo(false);
      setSelectedIndex(images.length - 1);
    } else {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : (videoUrl ? -1 : images.length - 1)));
      if (selectedIndex === 0 && videoUrl) {
        setShowingVideo(true);
      }
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showingVideo) {
      setShowingVideo(false);
      setSelectedIndex(0);
    } else if (selectedIndex === images.length - 1) {
      if (videoUrl) {
        setShowingVideo(true);
      } else {
        setSelectedIndex(0);
      }
    } else {
      setSelectedIndex((prev) => prev + 1);
    }
  };

  // Detectar si es video de YouTube o Vimeo
  const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
    } catch {}
    return url;
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs select-none">
      {/* Visualizador Principal */}
      <div className="relative aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center group">
        {showingVideo && videoUrl ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            {isYouTube ? (
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                title="Video del producto"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            )}
          </div>
        ) : (
          <div
            onClick={() => setZoomOpen(true)}
            className="w-full h-full relative cursor-zoom-in flex items-center justify-center"
            title="Toca para ampliar foto"
          >
            <SafeImage
              src={currentImage?.storagePath || '/placeholder.svg'}
              alt={currentImage?.altText || title}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          <ProductTypeBadge type={type} condition={condition} />
        </div>
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <ProductStatusBadge status={status} />
        </div>

        {/* Flechas de navegación (si hay más de 1 foto o video) */}
        {((hasImages && images.length > 1) || videoUrl) && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center font-bold text-lg opacity-80 group-hover:opacity-100 transition z-10 border border-slate-200"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center font-bold text-lg opacity-80 group-hover:opacity-100 transition z-10 border border-slate-200"
            >
              ›
            </button>
          </>
        )}

        {/* Contador de fotos en esquina inferior izquierda */}
        {!showingVideo && hasImages && images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full pointer-events-none z-10">
            {selectedIndex + 1} / {images.length}
          </div>
        )}

        {/* Overlay si no está disponible */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-20 pointer-events-auto">
            <div className="bg-white rounded-2xl p-4 text-center shadow-2xl max-w-xs">
              <span className="text-3xl block mb-1">
                {status === 'RESERVED' && '⏳'}
                {status === 'SOLD' && '✓'}
                {status === 'GIVEN_AWAY' && '🎁'}
              </span>
              <p className="text-lg font-black text-slate-900 uppercase">
                {status === 'RESERVED' && 'Artículo Reservado'}
                {status === 'SOLD' && 'Artículo Vendido'}
                {status === 'GIVEN_AWAY' && 'Regalo Entregado'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Este artículo ya no está disponible para contactar ni comprar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Miniaturas de Fotografías y Video */}
      {((hasImages && images.length > 1) || videoUrl) && (
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {images.map((img, idx) => {
            const isActive = !showingVideo && selectedIndex === idx;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  setShowingVideo(false);
                  setSelectedIndex(idx);
                }}
                className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white shrink-0 p-0.5 transition-all ${
                  isActive
                    ? 'ring-3 ring-[#FFE600] border-2 border-slate-900 shadow-md scale-102'
                    : 'border border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                }`}
                title={`Ver fotografía ${idx + 1}`}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <SafeImage
                    src={img.storagePath}
                    alt={img.altText || `${title} foto ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </button>
            );
          })}

          {/* Miniatura especial de Video si existe */}
          {videoUrl && (
            <button
              type="button"
              onClick={() => setShowingVideo(true)}
              className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 text-white shrink-0 p-1 flex flex-col items-center justify-center transition-all ${
                showingVideo
                  ? 'ring-3 ring-[#FFE600] border-2 border-yellow-400 shadow-md scale-102'
                  : 'border border-slate-700 opacity-80 hover:opacity-100'
              }`}
              title="Reproducir Video del producto"
            >
              <span className="text-2xl animate-pulse">🎥</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 mt-0.5">
                Video
              </span>
            </button>
          )}
        </div>
      )}

      {/* Modal Zoom en Pantalla Completa */}
      {zoomOpen && currentImage && !showingVideo && (
        <div
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <SafeImage
              src={currentImage.storagePath}
              alt={title}
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white text-white hover:text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
