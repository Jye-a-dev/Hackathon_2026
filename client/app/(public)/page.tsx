'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import FeedList from '@/components/feed/FeedList';
import { ProductCardSkeleton } from '@/components/modules/ProductCard';
import type { ListingCategory } from '@/types/listing';

function FeedLoadingGrid() {
  return (
    <div className="w-full min-h-screen bg-[#fafafa]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedContent() {
  const searchParams = useSearchParams();
  const category = (searchParams.get('category') as ListingCategory | 'ALL') || 'ALL';
  const radius = Number(searchParams.get('radius') || 0);
  const search = searchParams.get('search') || undefined;

  return (
    <div className="w-full min-h-screen bg-[#fafafa]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Hero Escrow Banner (Mobile: Stacked single column, Desktop: Row layout) ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-5 sm:p-8 text-white shadow-xl shadow-neutral-900/10 w-full">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>P2P 48h Escrow Marketplace</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                An tâm mua bán. Khóa quỹ bảo vệ 100%.
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Mọi đơn hàng được bảo đảm bằng Hợp đồng Ký quỹ tự động. Người bán nhận tiền chỉ khi bạn hoàn toàn hài lòng sau 48 giờ kiểm hàng.
              </p>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 sm:p-3 text-center">
                <div className="text-sm sm:text-base md:text-lg font-black text-emerald-400">48 Giờ</div>
                <div className="text-[10px] text-neutral-300 font-medium">Kiểm hàng an tâm</div>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 sm:p-3 text-center">
                <div className="text-sm sm:text-base md:text-lg font-black text-emerald-400">0% Scam</div>
                <div className="text-[10px] text-neutral-300 font-medium">Khóa quỹ Vault</div>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 sm:p-3 text-center">
                <div className="text-sm sm:text-base md:text-lg font-black text-emerald-400">VietQR</div>
                <div className="text-[10px] text-neutral-300 font-medium">Thanh toán tức thì</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feed Grid ── */}
        <FeedList
          category={category}
          radiusKm={radius}
          search={search}
        />
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedLoadingGrid />}>
      <FeedContent />
    </Suspense>
  );
}
