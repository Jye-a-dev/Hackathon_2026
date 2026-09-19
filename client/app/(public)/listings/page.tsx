'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  Laptop,
  Shirt,
  Footprints,
  Watch,
  BookOpen,
  Trophy,
  Search as SearchIcon,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import FeedList from '@/components/feed/FeedList';
import { ProductCardSkeleton } from '@/components/modules/ProductCard';
import type { ListingCategory } from '@/types/listing';

const CATEGORIES: { label: string; key: ListingCategory | 'ALL'; icon: typeof Sparkles }[] = [
  { label: 'Tất cả', key: 'ALL', icon: Sparkles },
  { label: 'Máy ảnh', key: 'CAMERA', icon: Camera },
  { label: 'Công nghệ', key: 'ELECTRONICS', icon: Laptop },
  { label: 'Thời trang', key: 'FASHION', icon: Shirt },
  { label: 'Sneakers', key: 'SNEAKERS', icon: Footprints },
  { label: 'Phụ kiện', key: 'ACCESSORIES', icon: Watch },
  { label: 'Sách', key: 'BOOKS', icon: BookOpen },
  { label: 'Thể thao', key: 'SPORTS', icon: Trophy },
];

const RADIUS_OPTIONS = [
  { label: 'Toàn quốc', value: 0 },
  { label: '5 km', value: 5 },
  { label: '15 km', value: 15 },
  { label: '30 km', value: 30 },
];

function ListingsSkeleton() {
  return (
    <div className="w-full min-h-screen bg-[#fafafa]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = (searchParams.get('category') as ListingCategory | 'ALL') || 'ALL';
  const currentRadius = Number(searchParams.get('radius') || 0);
  const currentSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = (updates: { category?: string; radius?: number; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category === 'ALL') {
        params.delete('category');
      } else {
        params.set('category', updates.category);
      }
    }

    if (updates.radius !== undefined) {
      if (updates.radius === 0) {
        params.delete('radius');
      } else {
        params.set('radius', updates.radius.toString());
      }
    }

    if (updates.search !== undefined) {
      const trimmed = updates.search.trim();
      if (!trimmed) {
        params.delete('search');
      } else {
        params.set('search', trimmed);
      }
    }

    startTransition(() => {
      router.push(`/listings?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Breadcrumbs & Header ── */}
        <div className="space-y-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <span className="text-neutral-900 font-semibold">Danh mục sản phẩm</span>
            {currentCategory !== 'ALL' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="text-emerald-600 font-semibold">
                  {CATEGORIES.find((c) => c.key === currentCategory)?.label || currentCategory}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                Sản Phẩm Ký Quỹ Đang Bán
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                100% sản phẩm được bảo vệ bằng hợp đồng ký quỹ 48 giờ tự động.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Bảo vệ quỹ 48h</span>
              </div>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors h-11 sm:h-9"
              >
                + Đăng tin bán
              </Link>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-xs">
          {/* Keyword Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <div className="group relative flex h-11 sm:h-10 w-full items-center rounded-xl border border-neutral-200 bg-neutral-50/80 px-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15">
              <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, danh mục, từ khóa..."
                className="h-full w-full min-w-0 bg-transparent px-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 border-none outline-hidden focus:outline-hidden ring-0 focus:ring-0"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilters({ search: '' });
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 text-xs"
                  aria-label="Xóa từ khóa"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Radius Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs font-medium text-neutral-500 shrink-0 flex items-center gap-1 pl-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Bán kính:
            </span>
            {RADIUS_OPTIONS.map((opt) => {
              const isSelected = currentRadius === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFilters({ radius: opt.value })}
                  className={`h-9 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Category Chips Slider ── */}
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map(({ label, key, icon: Icon }) => {
              const isActive = currentCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateFilters({ category: key })}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all shrink-0 h-10 ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs ring-2 ring-neutral-900/10'
                      : 'bg-white border border-neutral-200/90 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Marketplace Feed Grid ── */}
        <FeedList
          category={currentCategory}
          radiusKm={currentRadius}
          search={currentSearch || undefined}
          onResetCategory={() => updateFilters({ category: 'ALL', radius: 0, search: '' })}
        />
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsSkeleton />}>
      <ListingsContent />
    </Suspense>
  );
}
