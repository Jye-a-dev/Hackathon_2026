'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import FeedList from '@/components/feed/FeedList';
import { ProductCardSkeleton } from '@/components/modules/ProductCard';
import type { ListingCategory } from '@/types/listing';

function FeedLoadingGrid() {
  return (
    <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 w-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
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
    <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-6">
      {/* ── Full-Width Hero Trust Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-6 sm:p-10 text-white shadow-xl shadow-neutral-900/10 mb-8 w-full">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>P2P 48h Escrow Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              An tâm mua bán. Khóa quỹ bảo vệ 100%.
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Mọi đơn hàng được bảo đảm bằng Hợp đồng Ký quỹ tự động. Người bán nhận tiền chỉ khi bạn hoàn toàn hài lòng sau 48 giờ kiểm hàng.
            </p>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-center">
              <div className="text-base sm:text-lg font-black text-emerald-400">48 Giờ</div>
              <div className="text-[10px] text-neutral-300 font-medium">Kiểm hàng an tâm</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-center">
              <div className="text-base sm:text-lg font-black text-emerald-400">0% Scam</div>
              <div className="text-[10px] text-neutral-300 font-medium">Khóa quỹ Vault</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-center">
              <div className="text-base sm:text-lg font-black text-emerald-400">VietQR</div>
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
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedLoadingGrid />}>
      <FeedContent />
    </Suspense>
  );
}
