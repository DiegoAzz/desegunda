import Link from 'next/link';
import { ProductType } from '@/lib/types';

interface BigCategoryButtonsProps {
  activeType?: ProductType | 'ALL';
}

export default function BigCategoryButtons({ activeType }: BigCategoryButtonsProps) {
  const buttons = [
    {
      id: 'NEW',
      label: 'NUEVOS',
      href: '/nuevos',
      icon: '🆕',
      color: 'bg-[#00A650] hover:bg-[#009146] text-white border-[#00823c]',
      activeColor: 'ring-4 ring-green-300 bg-[#00823c] text-white',
    },
    {
      id: 'USED',
      label: 'USADOS',
      href: '/usados',
      icon: '♻️',
      color: 'bg-[#3483FA] hover:bg-[#2968C8] text-white border-[#2257a7]',
      activeColor: 'ring-4 ring-blue-300 bg-[#2257a7] text-white',
    },
    {
      id: 'GIFT',
      label: 'GRATIS',
      href: '/gratis',
      icon: '🎁',
      color: 'bg-[#FF7733] hover:bg-[#e65c1a] text-white border-[#cc4e12]',
      activeColor: 'ring-4 ring-orange-300 bg-[#cc4e12] text-white',
    },
  ];

  return (
    <nav aria-label="Categorías principales" className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {buttons.map((btn) => {
        const isActive = activeType === btn.id;
        return (
          <Link
            key={btn.id}
            href={btn.href}
            className={`min-h-[56px] px-5 py-3.5 rounded-xl flex items-center justify-between text-base sm:text-lg font-black tracking-wide shadow-sm transition-all active:scale-[0.98] border-b-4 ${
              isActive ? btn.activeColor : btn.color
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span className="text-xl sm:text-2xl" role="img" aria-hidden="true">
                {btn.icon}
              </span>
              <span>{btn.label}</span>
            </div>
            <span className="text-xl font-bold opacity-80" aria-hidden="true">
              →
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
