'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search as SearchIcon,
  Sparkles,
  Camera,
  Laptop,
  Shirt,
  Footprints,
  Watch,
  BookOpen,
  Trophy,
  AlertTriangle,
  PackageOpen,
  ShieldCheck,
} from 'lucide-react';
import { formatVND } from '@/utils/formatCurrency';
import { listingsApi } from '@/libs/api';
import type { Listing, ListingCategory } from '@/types/listing';

const categories = [
  { label: 'Tất cả', Icon: Sparkles, key: 'ALL' },
  { label: 'Máy ảnh', Icon: Camera, key: 'CAMERA' },
  { label: 'Công nghệ', Icon: Laptop, key: 'ELECTRONICS' },
  { label: 'Thời trang', Icon: Shirt, key: 'FASHION' },
  { label: 'Sneakers', Icon: Footprints, key: 'SNEAKERS' },
  { label: 'Phụ kiện', Icon: Watch, key: 'ACCESSORIES' },
  { label: 'Sách', Icon: BookOpen, key: 'BOOKS' },
  { label: 'Thể thao', Icon: Trophy, key: 'SPORTS' },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await listingsApi.list({
          search: searchTerm.trim() || undefined,
          category:
            selectedCat !== 'ALL'
              ? (selectedCat as ListingCategory)
              : undefined,
          limit: 30,
        });
        setResults(res.data);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Lỗi tìm kiếm từ máy chủ');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCat]);

  return (
    <div className="w-full max-w-full pb-24 md:pb-12">
      <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6">
        {/* Search Input */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="group relative flex h-12 w-full items-center rounded-2xl border border-neutral-200/90 bg-white px-4 transition-all duration-200 hover:border-neutral-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:shadow-md">
            <SearchIcon className="h-5 w-5 shrink-0 text-neutral-400 transition-colors duration-200 group-focus-within:text-emerald-600" />
            <input
              type="text"
              role="searchbox"
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm máy ảnh, laptop, sneaker, thời trang..."
              className="h-full w-full min-w-0 bg-transparent px-3 text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 border-none outline-none focus:outline-none ring-0 focus:ring-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
            Danh mục sản phẩm
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => {
              const Icon = c.Icon;
              const isActive = selectedCat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setSelectedCat(c.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Header */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/80">
          <span className="font-bold text-neutral-800 text-sm">
            {loading ? 'Đang tìm kiếm...' : `Kết quả tìm kiếm (${results.length})`}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200/60">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Bảo vệ Ký quỹ 48h
          </span>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-neutral-200/80 p-3 space-y-2 shadow-xs"
              >
                <div className="skeleton aspect-[4/5] w-full rounded-xl" />
                <div className="skeleton h-3.5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center max-w-md mx-auto shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="font-bold text-neutral-800 text-sm mb-1">{errorMsg}</p>
            <p className="text-xs text-neutral-500">
              Vui lòng kiểm tra kết nối với máy chủ.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto bg-white rounded-3xl border border-neutral-200/80 shadow-xs px-4">
            <PackageOpen className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
            <h4 className="font-bold text-neutral-800 text-sm">
              Không tìm thấy món đồ phù hợp
            </h4>
            <p className="text-xs text-neutral-500 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác.
            </p>
          </div>
        ) : (
          /* Results Responsive Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {results.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative aspect-[4/5] w-full bg-neutral-100 overflow-hidden">
                  {item.images?.[0] ? (
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      <PackageOpen className="h-8 w-8" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                    {item.location?.district || 'Toàn quốc'}
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-neutral-800 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-sm font-extrabold text-emerald-600 font-sans">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
