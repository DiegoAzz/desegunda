'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Comprobar si ya se mostró en esta sesión para no ser invasivo en cada clic
    const hasSeenSplash = sessionStorage.getItem('lotengo_splash_shown');
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }

    // Iniciar desvanecimiento a los 1.6 segundos
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1600);

    // Ocultar por completo a los 2.1 segundos
    const timer2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('lotengo_splash_shown', 'true');
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFE600] transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center text-center px-4">
        {/* Contenedor del Logo */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-2xl flex items-center justify-center mb-4 border-4 border-[#2D3277]/10 animate-bounce">
          <span className="text-5xl sm:text-6xl select-none" role="img" aria-label="Logo LO TENGO">
            ♻️
          </span>
        </div>

        {/* Nombre de la Tienda */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2D3277] mb-1">
          LO TENGO
        </h1>

        {/* Lema */}
        <p className="text-sm sm:text-base font-bold text-[#2D3277]/85 tracking-wide">
          Cosas buenas para alguien más.
        </p>

        {/* Puntos de carga estilo Mercado Libre */}
        <div className="flex items-center space-x-2 mt-6">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D3277] animate-ping" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D3277] animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D3277]" />
        </div>
      </div>
    </div>
  );
}
