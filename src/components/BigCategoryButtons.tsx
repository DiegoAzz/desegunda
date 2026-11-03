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
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
      activeColor: 'ring-4 ring-emerald-300 bg-emerald-700 text-white',
    },
    {
      id: 'USED',
      label: 'USADOS',
      href: '/usados',
      icon: '♻️',
      color: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700',
      activeColor: 'ring-4 ring-blue-300 bg-blue-700 text-white',
    },
    {
      id: 'GIFT',
      label: 'GRATIS',
      href: '/gratis',
      icon: '🎁',
      color: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700',
      activeColor: 'ring-4 ring-amber-300 bg-amber-700 text-white',
    },
  ];

  return (
    <nav aria-label="Categorías principales" className="w-full space-y-3">
      {buttons.map((btn) => {
        const isActive = activeType === btn.id;
        return (
          <Link
            key={btn.id}
            href={btn.href}
            className={`w-full min-h-[56px] px-6 py-4 rounded-2xl flex items-center justify-between text-xl font-black tracking-wide shadow-md transition-all active:scale-[0.98] border-b-4 ${
              isActive ? btn.activeColor : btn.color
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl" role="img" aria-hidden="true">
                {btn.icon}
              </span>
              <span>{btn.label}</span>
            </div>
            <span className="text-2xl font-bold opacity-80" aria-hidden="true">
              →
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
