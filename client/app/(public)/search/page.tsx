'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search as SearchIcon, MapPin, PackageOpen, RefreshCw } from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { formatVND } from '@/utils/formatCurrency';
import { listingsApi } from '@/libs/api';
import type { Listing, ListingCategory } from '@/types/listing';

const categories = [
  { label: 'Tất cả', icon: '✨', key: 'ALL' },
  { label: 'Máy ảnh', icon: '📷', key: 'CAMERA' },
  { label: 'Công nghệ', icon: '💻', key: 'ELECTRONICS' },
  { label: 'Thời trang', icon: '👕', key: 'FASHION' },
  { label: 'Sneakers', icon: '👟', key: 'SNEAKERS' },
  { label: 'Phụ kiện', icon: '⌚', key: 'ACCESSORIES' },
  { label: 'Sách', icon: '📚', key: 'BOOKS' },
  { label: 'Thể thao', icon: '⚽', key: 'SPORTS' },
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
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <Header title="Tìm kiếm & Khám phá" showLocation={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm máy ảnh, laptop, sneaker, thời trang..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Categories Bar */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Danh mục sản phẩm
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCat(c.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl border text-xs font-bold shrink-0 transition-all ${
                  selectedCat === c.key
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm scale-102'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Header */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
          <span className="font-bold text-slate-800 text-sm">
            {loading ? 'Đang tìm kiếm...' : `Kết quả tìm kiếm (${results.length})`}
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold">
            Bảo vệ ký quỹ 48h
          </span>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2 shadow-xs"
              >
                <div className="skeleton aspect-square w-full rounded-xl" />
                <div className="skeleton h-3.5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="bg-white rounded-3xl p-8 border border-red-100 text-center max-w-md mx-auto shadow-xs">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="font-bold text-slate-800 text-sm mb-1">{errorMsg}</p>
            <p className="text-xs text-slate-400">
              Vui lòng kiểm tra kết nối với máy chủ backend.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xs px-4">
            <PackageOpen className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">
              Không tìm thấy món đồ phù hợp
            </h4>
            <p className="text-xs text-slate-400 mt-1">
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
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={item.images[0]}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                    {item.location.district}
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-sm font-black text-emerald-600">
                    {formatVND(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
