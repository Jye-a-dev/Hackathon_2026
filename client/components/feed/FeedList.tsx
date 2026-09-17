'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { RefreshCw, PackageOpen, Loader2 } from 'lucide-react';
import { listingsApi } from '@/libs/api';
import ProductCard from '@/components/feed/FeedCard';
import type {
  Listing,
  ListingCategory,
  PaginatedListings,
  ListingQueryParams,
} from '@/types/listing';

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/80 sm:rounded-3xl">
      <div className="skeleton aspect-3/4 w-full" />
      <div className="space-y-2.5 p-3 sm:p-3.5">
        <div className="skeleton h-5 w-20 rounded-lg" />
        <div className="skeleton h-4 w-4/5 rounded-lg" />
        <div className="skeleton h-3.5 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}

// ─── FeedList ──────────────────────────────────────────────────────────────────

interface FeedListProps {
  category?: ListingCategory | 'ALL';
  radiusKm?: number;
}

export default function FeedList({ category = 'ALL', radiusKm = 0 }: FeedListProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    useInfiniteQuery<PaginatedListings>({
      queryKey: ['listings', { category, radiusKm }],
      initialPageParam: 1,
      queryFn: async ({ pageParam = 1 }) => {
        const params: ListingQueryParams = {
          page: Number(pageParam),
          limit: 12,
          ...(category !== 'ALL' ? { category } : {}),
          ...(radiusKm > 0 ? { radiusKm } : {}),
        };
        return listingsApi.list(params);
      },
      getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
      staleTime: 1000 * 15,
    });

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: '500px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listings: Listing[] = data?.pages.flatMap((p) => p.data) ?? [];

  // ── Error state ──
  if (isError) {
    return (
      <div className="mx-auto mt-16 max-w-xs rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
        <p className="text-4xl">⚠️</p>
        <h3 className="mt-4 text-base font-semibold text-neutral-800">Không thể tải dữ liệu</h3>
        <p className="mt-1.5 text-sm text-neutral-500">
          {(error as Error)?.message ?? 'Lỗi kết nối máy chủ.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <RefreshCw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (!isLoading && listings.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-xs rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
        <PackageOpen className="mx-auto h-12 w-12 text-neutral-300" />
        <h3 className="mt-4 text-base font-semibold text-neutral-800">Không có sản phẩm</h3>
        <p className="mt-1.5 text-sm text-neutral-500">
          Thử danh mục khác hoặc mở rộng khu vực tìm kiếm.
        </p>
        <button
          onClick={() => router.push('/sell')}
          className="mt-6 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          + Đăng bán đầu tiên
        </button>
      </div>
    );
  }

  return (
    <main className="w-full px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)
          : listings.map((listing, idx) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                index={idx}
                onChatClick={(l) => router.push(`/chat?listingId=${l.id}&seller=${l.seller.id}`)}
              />
            ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="mt-6 h-6" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      )}

      {!isLoading && !hasNextPage && listings.length > 0 && (
        <p className="py-12 text-center text-sm text-neutral-400">
          Đã hiển thị tất cả{' '}
          <strong className="font-semibold text-neutral-600">{listings.length}</strong> sản phẩm
        </p>
      )}
    </main>
  );
}
