'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { ListingCategory } from '@/types/listing';

const CATEGORIES: { emoji: string; label: string; value: ListingCategory | 'ALL' }[] = [
  { emoji: '🛍️', label: 'Tất cả',    value: 'ALL' },
  { emoji: '👗', label: 'Thời trang', value: 'FASHION' },
  { emoji: '📱', label: 'Điện tử',   value: 'ELECTRONICS' },
  { emoji: '👟', label: 'Sneaker',   value: 'SNEAKERS' },
  { emoji: '📷', label: 'Máy ảnh',   value: 'CAMERA' },
  { emoji: '💍', label: 'Phụ kiện',  value: 'ACCESSORIES' },
  { emoji: '📚', label: 'Sách',      value: 'BOOKS' },
  { emoji: '⚽', label: 'Thể thao', value: 'SPORTS' },
];

const RADII = [
  { label: 'Mọi nơi', value: 0 },
  { label: '< 5km',   value: 5 },
  { label: '< 10km',  value: 10 },
  { label: '< 20km',  value: 20 },
];

interface FilterBarProps {
  onCategoryChange?: (cat: ListingCategory | 'ALL') => void;
  onRadiusChange?: (km: number) => void;
}

export default function FilterBar({ onCategoryChange, onRadiusChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [activeRadius, setActiveRadius] = useState(0);

  const pickCategory = (cat: ListingCategory | 'ALL') => {
    setActiveCategory(cat);
    onCategoryChange?.(cat);
  };

  const pickRadius = (km: number) => {
    setActiveRadius(km);
    onRadiusChange?.(km);
  };

  return (
    <div className="sticky top-16 z-40 border-b border-neutral-200/70 bg-white/90 backdrop-blur-2xl sm:top-17">
      <div className="w-full">

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(({ emoji, label, value }) => (
            <button
              key={value}
              onClick={() => pickCategory(value)}
              className={clsx(
                'flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                activeCategory === value
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50',
              )}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>

        {/* Distance filter row */}
        <div className="flex items-center gap-2 border-t border-neutral-100 px-4 py-2 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Bán kính
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {RADII.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => pickRadius(value)}
                className={clsx(
                  'shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  activeRadius === value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
