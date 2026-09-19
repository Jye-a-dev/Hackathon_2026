'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useListings } from '@/hooks/useMarketplace';
import ProductCard, { ProductCardSkeleton } from '@/components/modules/ProductCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBanner } from '@/components/common/EmptyState';
import type { Listing, ListingCategory, ListingQueryParams } from '@/types/listing';

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface FeedListProps {
  category?: ListingCategory | 'ALL';
  radiusKm?: number;
  search?: string;
  onResetCategory?: () => void;
}

export default function FeedList({
  category = 'ALL',
  radiusKm = 0,
  search,
  onResetCategory,
}: FeedListProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const params: ListingQueryParams = {
    limit: 12,
    ...(category !== 'ALL' ? { category } : {}),
    ...(radiusKm > 0 ? { radiusKm } : {}),
    ...(search ? { search } : {}),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useListings(params);

  useEffect(() => {
    if (isError && error) {
      const msg = (error as ApiErrorResponse)?.response?.data?.message ?? (error as Error)?.message ?? 'Không thể kết nối đến máy chủ.';
      toast.error(msg);
    }
  }, [isError, error]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '500px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listings: Listing[] = data?.pages.flatMap((p) => p.data) ?? [];

  if (isError) {
    const msg = (error as ApiErrorResponse)?.response?.data?.message ?? (error as Error)?.message ?? 'Lỗi kết nối máy chủ.';
    return (
      <div className="py-12">
        <ErrorBanner message={msg} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!isLoading && listings.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={PackageOpen}
          title="Chưa có dữ liệu phù hợp"
          description="Hiện tại chưa có sản phẩm nào trong bộ lọc này. Hãy thử đặt lại danh mục hoặc mở rộng bán kính."
          action={
            category !== 'ALL' && onResetCategory
              ? {
                  label: 'Xem tất cả sản phẩm',
                  onClick: onResetCategory,
                }
              : {
                  label: '+ Đăng tin bán ngay',
                  href: '/sell',
                }
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : listings.map((listing, idx) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                index={idx}
                onChatClick={(l) => router.push(`/chat?listingId=${l.id}&seller=${l.seller.id}`)}
              />
            ))}
      </div>

      <div ref={sentinelRef} className="mt-8 h-6" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      )}

      {!isLoading && !hasNextPage && listings.length > 0 && (
        <p className="py-12 text-center text-xs font-semibold text-neutral-400">
          Đã tải hết toàn bộ <span className="text-neutral-700">{listings.length}</span> sản phẩm được bảo vệ ký quỹ
        </p>
      )}
    </div>
  );
}
