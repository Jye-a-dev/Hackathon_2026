'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShieldCheck, MessageCircle, CheckCircle2, MapPin, Package, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { Listing } from '@/types/listing';

interface ProductCardProps {
  listing: Listing;
  index?: number;
  onChatClick?: (listing: Listing) => void;
}

const CONDITION_DISPLAY_MAP: Record<string, string> = {
  NEW: 'Mới 100% Seal',
  LIKE_NEW: 'Like New 99%',
  GOOD: '95% Hoạt động tốt',
  FAIR: 'Đã sử dụng',
};

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full overflow-hidden rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
      <div className="aspect-4/5 w-full animate-pulse bg-neutral-100" />
      <div className="space-y-2 p-3.5">
        <div className="h-5 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ listing, index = 0, onChatClick }: ProductCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);

  const conditionText = CONDITION_DISPLAY_MAP[listing.condition] ?? 'Like New 99%';
  const hasImage = Boolean(listing.images && listing.images.length > 0 && listing.images[0]);
  const imageUrl = hasImage ? listing.images[0] : null;

  const seller = listing.seller ?? {
    id: 'seller',
    username: 'Người bán',
    avatarUrl: undefined,
    rating: undefined,
    isVerified: false,
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => !prev);
  };

  const handleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onChatClick) {
      onChatClick(listing);
    } else {
      router.push(`/chat?listingId=${listing.id}&seller=${seller.id}`);
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/listings/${listing.id}`);
  };

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(listing.price);

  const formattedOriginalPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Math.round(listing.price * 1.15));

  return (
    <Link href={`/listings/${listing.id}`} className="group block focus:outline-hidden w-full" tabIndex={0}>
      <article className="w-full overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-xl transition-all duration-300 ease-out flex flex-col">
        {/* ── Fixed 4:5 Aspect Ratio Image Container ── */}
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-neutral-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              priority={index < 4}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
              <Package className="h-12 w-12 stroke-[1.5]" />
            </div>
          )}

          {/* Gradient scrim for badge readability */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

          {/* Top-left: Glassmorphic Ký quỹ 48h pill */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 backdrop-blur-md bg-white/90 text-emerald-800 border border-emerald-200/60 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
            <ShieldCheck className="h-3 w-3 text-emerald-600 stroke-[2.5]" />
            <span>Ký quỹ 48h</span>
          </div>

          {/* Top-right: Heart wishlist toggle */}
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? 'Bỏ lưu' : 'Lưu tin'}
            className="absolute right-2.5 top-2.5 flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/85 text-neutral-600 shadow-xs backdrop-blur-sm transition-all hover:bg-white hover:text-rose-500 active:scale-[0.98] duration-100"
          >
            <Heart className={clsx('h-4 w-4 transition-colors', liked && 'fill-rose-500 text-rose-500')} />
          </button>

          {/* Bottom-left: Condition label */}
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
            {conditionText}
          </span>

          {/* Hover Action Bar (Desktop only, mobile relies on direct tap navigation) */}
          <div className="hidden sm:flex absolute inset-x-2.5 bottom-2.5 translate-y-3 gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleChat}
              className="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-white/95 text-[11px] font-bold text-neutral-800 shadow-md backdrop-blur-md transition hover:bg-white active:scale-[0.98] duration-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              type="button"
              onClick={handleBuy}
              className="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-neutral-900 text-[11px] font-bold text-white shadow-md transition hover:bg-neutral-800 active:scale-[0.98] duration-100"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Mua Ký Quỹ
            </button>
          </div>
        </div>

        {/* ── Meta Footer ── */}
        <div className="flex flex-col gap-1 p-2 pt-2.5">
          {/* Title (Single-line truncated) */}
          <h3 className="truncate text-xs sm:text-sm font-semibold text-neutral-800 transition-colors group-hover:text-emerald-700">
            {listing.title}
          </h3>

          {/* Pricing: Primary formatted VNĐ price & original crossed-out price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-black tracking-tight text-neutral-950 font-sans">
              {formattedPrice}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 line-through">
              {formattedOriginalPrice}
            </span>
          </div>

          {/* Seller Rating Line: Avatar, Name, Rating Star, District */}
          <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-2 text-[11px] text-neutral-500">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                {seller.avatarUrl ? (
                  <Image src={seller.avatarUrl} alt={seller.username} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-[9px] font-bold text-white">
                    {seller.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="truncate max-w-16 sm:max-w-20 font-medium text-neutral-700">
                {seller.username}
              </span>
              {seller.isVerified && (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[10px]">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                {Number(seller.rating ?? 5.0).toFixed(1)}
              </span>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center gap-0.5 text-neutral-400 text-[10px]">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate max-w-12 sm:max-w-16">{listing.location?.district || 'Toàn quốc'}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

