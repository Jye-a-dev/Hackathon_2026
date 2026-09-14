'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { ListingCategory } from '@/types/listing';

const categories: { label: string; value: ListingCategory | 'ALL' }[] = [
  { label: '✨ Tất cả', value: 'ALL' },
  { label: '👗 Thời trang', value: 'FASHION' },
  { label: '📱 Điện tử', value: 'ELECTRONICS' },
  { label: '👟 Sneaker', value: 'SNEAKERS' },
  { label: '📷 Máy ảnh', value: 'CAMERA' },
  { label: '💍 Phụ kiện', value: 'ACCESSORIES' },
  { label: '📚 Sách', value: 'BOOKS' },
  { label: '⚽ Thể thao', value: 'SPORTS' },
];

const radii = [
  { label: 'Mọi nơi', value: 0 },
  { label: '< 5km', value: 5 },
  { label: '< 10km', value: 10 },
  { label: '< 20km', value: 20 },
];

interface FilterBarProps {
  onCategoryChange?: (cat: ListingCategory | 'ALL') => void;
  onRadiusChange?: (km: number) => void;
}

export default function FilterBar({ onCategoryChange, onRadiusChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [activeRadius, setActiveRadius] = useState(0);

  const handleCategory = (cat: ListingCategory | 'ALL') => {
    setActiveCategory(cat);
    onCategoryChange?.(cat);
  };

  const handleRadius = (km: number) => {
    setActiveRadius(km);
    onRadiusChange?.(km);
  };

  return (
    <div className="bg-white border-b border-slate-100 py-3 sticky top-[57px] z-30">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {categories.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleCategory(value)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200',
              activeCategory === value
                ? 'gradient-primary text-white shadow-md scale-105'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Radius filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-1 scrollbar-hide">
        {radii.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleRadius(value)}
            className={clsx(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200',
              activeRadius === value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
            )}
          >
            📍 {label}
          </button>
        ))}
      </div>
    </div>
  );
}
