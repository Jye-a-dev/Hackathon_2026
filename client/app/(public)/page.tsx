'use client';

import { Suspense, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import PublicNavbar from '@/components/layouts/PublicNavbar';
import BottomNav from '@/components/common/BottomNav';
import FeedList from '@/components/feed/FeedList';
import { ProductCardSkeleton } from '@/components/modules/ProductCard';
import type { ListingCategory } from '@/types/listing';

function FeedLoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function FeedPage() {
  const [category, setCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [radius, setRadius] = useState(0);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <PublicNavbar
        showCategoryBar
        activeCategory={category}
        activeRadius={radius}
        onCategoryChange={setCategory}
        onRadiusChange={setRadius}
      />

      <main className="mx-auto max-w-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Trust Banner ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-rrom-neutral-900 via-neutral-800 to-neutral-900 p-6 sm:p-8 text-white shadow-xl shadow-neutral-900/10 mb-8">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>P2P 48h Escrow Marketplace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
                An tâm mua bán. Khóa quỹ bảo vệ 100%.
              </h1>
              <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
                Mọi đơn hàng được bảo đảm bằng Hợp đồng Ký quỹ tự động. Người bán nhận tiền chỉ khi bạn hoàn toàn hài lòng sau 48 giờ kiểm hàng.
              </p>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-center">
                <div className="text-base sm:text-lg font-black text-emerald-400">48 Giờ</div>
                <div className="text-[10px] text-emerald-700 font-medium">Kiểm hàng an tâm</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-center">
                <div className="text-base sm:text-lg font-black text-emerald-400">0% Scam</div>
                <div className="text-[10px] text-emerald-700 font-medium">Khóa quỹ Vault</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-center">
                <div className="text-base sm:text-lg font-black text-emerald-400">VietQR</div>
                <div className="text-[10px] text-emerald-700 font-medium">Thanh toán tức thì</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feed Grid ── */}
        <Suspense fallback={<FeedLoadingGrid />}>
          <FeedList
            category={category}
            radiusKm={radius}
            onResetCategory={() => setCategory('ALL')}
          />
        </Suspense>
      </main>

      <div className="pb-24 md:hidden" aria-hidden />
      <BottomNav />
    </div>
  );
}
