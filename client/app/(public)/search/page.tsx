'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search as SearchIcon, MapPin, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Search as SearchIcon } from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { formatVND } from '@/utils/formatCurrency';
import { MOCK_LISTINGS } from '@/constants/mockData';

const categories = [
  { label: 'Tất cả', icon: '✨', key: 'ALL' },
  { label: 'Máy ảnh', icon: '📷', key: 'CAMERA' },
  { label: 'Công nghệ', icon: '💻', key: 'ELECTRONICS' },
  { label: 'Thời trang', icon: '👕', key: 'FASHION' },
  { label: 'Sneakers', icon: '👟', key: 'SNEAKERS' },
  { label: 'Phụ kiện', icon: '⌚', key: 'ACCESSORIES' },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  const filtered = MOCK_LISTINGS.filter((item) => {
    const matchesCat = selectedCat === 'ALL' || item.category === selectedCat;
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.district.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Header title="Tìm kiếm & Khám phá" showLocation={false} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm máy ảnh, sneaker, đồ vintage..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Categories Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 mb-2">Danh mục nổi bật</h3>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCat(c.key)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  selectedCat === c.key
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-xs'
                    : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xl mb-1">{c.icon}</span>
                <span className="text-[11px]">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Kết quả ({filtered.length})
            </span>
            <span className="text-slate-400 text-[11px]">Bảo vệ ký quỹ 48h</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={item.images[0]}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                    {item.location.district}
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm font-black text-emerald-600">
                    {formatVND(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
