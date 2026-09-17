'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShieldCheck, MessageCircle, Star, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import type { Listing } from '@/types/listing';
import { formatVND } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';

interface ProductCardProps {
  listing: Listing;
  index?: number;
  onChatClick?: (listing: Listing) => void;
}

const CONDITION_MAP: Record<string, { label: string; color: string }> = {
  NEW:      { label: 'Mới 100%',  color: 'bg-emerald-500' },
  LIKE_NEW: { label: 'Like New',  color: 'bg-sky-500' },
  GOOD:     { label: 'Còn tốt',   color: 'bg-amber-500' },
  FAIR:     { label: 'Đã dùng',   color: 'bg-neutral-500' },
};

const FALLBACK =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

export default function ProductCard({ listing, index = 0, onChatClick }: ProductCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const images = listing.images?.length ? listing.images : [FALLBACK];
  const seller = listing.seller ?? {
    id: 'unknown', username: 'Người bán',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user',
    rating: 5.0, isVerified: true,
  };
  const cond = CONDITION_MAP[listing.condition] ?? CONDITION_MAP.FAIR;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setLiked((p) => !p);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
    }
  };

  const handleChat = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (onChatClick) {
      onChatClick(listing);
    } else {
      router.push(`/chat?listingId=${listing.id}&seller=${seller.id}`);
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    router.push(`/listings/${listing.id}`);
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block" tabIndex={0}>
      <article className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/80 transition-all duration-200 hover:shadow-xl hover:shadow-neutral-900/8 hover:ring-neutral-300 sm:rounded-3xl">

        {/* ── Image Frame ── */}
        <div
          className="relative aspect-3/4 overflow-hidden bg-neutral-100"
          onDoubleClick={handleDoubleTap}
        >
          <Image
            src={images[0] || FALLBACK}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            priority={index < 6}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Gradient scrim — bottom for badge legibility */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

          {/* TOP-LEFT: Escrow trust badge */}
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600" />
            Ký quỹ 48h
          </span>

          {/* TOP-RIGHT: Favorite */}
          <button
            onClick={handleLike}
            aria-label={liked ? 'Bỏ thích' : 'Yêu thích'}
            className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-neutral-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-rose-500 active:scale-90"
          >
            <Heart
              className={clsx('h-4.5 w-4.5 transition-all', liked && 'fill-rose-500 text-rose-500 scale-110')}
            />
          </button>

          {/* BOTTOM-LEFT: Condition pill */}
          <span className={clsx(
            'absolute bottom-2.5 left-2.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm',
            cond.color + '/80',
          )}>
            {cond.label}
          </span>

          {/* Multiple images badge */}
          {images.length > 1 && (
            <span className="absolute bottom-2.5 right-2.5 flex items-center gap-0.5 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              📷 {images.length}
            </span>
          )}

          {/* Double-tap heart */}
          {showHeart && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Heart className="heart-burst h-24 w-24 fill-white text-white drop-shadow-2xl" />
            </div>
          )}

          {/* Hover slide-up action bar */}
          <div className="absolute inset-x-2.5 bottom-2.5 flex translate-y-4 gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleChat}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/95 text-[12px] font-semibold text-neutral-800 shadow-md backdrop-blur-md transition hover:bg-white active:scale-[0.97]"
            >
              <MessageCircle className="h-4 w-4" />
              Nhắn tin
            </button>
            <button
              onClick={handleBuy}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-[12px] font-semibold text-white shadow-md transition hover:bg-neutral-800 active:scale-[0.97]"
            >
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              Mua Ký Quỹ
            </button>
          </div>
        </div>

        {/* ── Card Body ── */}
        <div className="flex flex-col gap-1 p-3 sm:p-3.5">
          {/* Price */}
          <p className="text-base font-bold tracking-tight text-neutral-900 sm:text-[17px]">
            {formatVND(listing.price)}
          </p>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-neutral-700 transition-colors group-hover:text-emerald-700">
            {listing.title}
          </h3>

          {/* Seller meta */}
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="flex items-center gap-0.5 text-amber-500 font-medium">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {Number(seller.rating ?? 5).toFixed(1)}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="max-w-20 truncate font-medium text-neutral-500">
              {seller.username}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {listing.location?.district ?? 'HCM'}
            </span>
          </div>

          {/* Time */}
          <p className="text-[10px] text-neutral-300">{timeAgo(listing.createdAt)}</p>
        </div>
      </article>
    </Link>
  );
}
