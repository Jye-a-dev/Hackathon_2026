'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listingsApi } from '@/libs/api';
import FeedCard from '@/components/feed/FeedCard';
import FilterBar from '@/components/feed/FilterBar';
import type { Listing, ListingCategory, PaginatedListings, ListingQueryParams } from '@/types/listing';
import { getMockListings } from '@/constants/mockData';

export default function FeedList() {
  const router = useRouter();
  const [category, setCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [radiusKm, setRadiusKm] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<PaginatedListings>({
    queryKey: ['listings', { category, radiusKm }],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params: ListingQueryParams = {
        page: Number(pageParam),
        limit: 10,
        ...(category !== 'ALL' ? { category } : {}),
        ...(radiusKm > 0 ? { radiusKm } : {}),
      };

      try {
        const res = await listingsApi.list(params);
        if (res?.data && res.data.length > 0) {
          return res;
        }
        return getMockListings(params);
      } catch (err) {
        console.warn('API error or server not running, falling back to curated mock data:', err);
        return getMockListings(params);
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    staleTime: 1000 * 30,
  });

  // Native IntersectionObserver for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listings: Listing[] = data?.pages.flatMap((page) => page.data) ?? [];

  const handleChat = (listing: Listing) => {
    router.push(`/chat?listingId=${listing.id}&seller=${listing.seller.id}`);
  };

  const handleBuy = (listing: Listing) => {
    router.push(`/listings/${listing.id}`);
  };

  return (
    <section className="feed-container mx-auto max-w-lg">
      <FilterBar
        onCategoryChange={(cat) => setCategory(cat)}
        onRadiusChange={(km) => setRadiusKm(km)}
      />

      {isLoading ? (
        <div className="space-y-4 p-4">
          {[1, 2].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-3 w-40" />
                </div>
              </div>
              <div className="skeleton aspect-square w-full rounded-xl" />
              <div className="mt-3 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center px-4">
          <p className="text-4xl mb-2">🔍</p>
          <p className="font-semibold text-slate-700">Chưa có món đồ nào trong danh mục này</p>
          <p className="text-sm text-slate-400 mt-1">Hãy thử chọn danh mục khác hoặc mở rộng bán kính tìm kiếm</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {listings.map((listing, idx) => (
            <FeedCard
              key={listing.id}
              listing={listing}
              index={idx}
              onChatClick={handleChat}
              onBuyClick={handleBuy}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-6" />
      {isFetchingNextPage && (
        <p className="py-4 text-center text-xs font-semibold text-emerald-600 animate-pulse">
          Đang tải thêm món đồ mới...
        </p>
      )}
      {!hasNextPage && listings.length > 0 && (
        <p className="py-6 text-center text-xs text-slate-400">
          ✨ Bạn đã xem hết tất cả món đồ mới nhất
        </p>
      )}
    </section>
  );
}
