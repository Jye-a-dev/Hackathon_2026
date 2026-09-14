'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, MapPin, ShieldCheck, Star, Images } from 'lucide-react';
import { clsx } from 'clsx';
import type { Listing } from '@/types/listing';
import { formatVND, formatVNDCompact } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';

interface FeedCardProps {
  listing: Listing;
  index?: number;
  onChatClick?: (listing: Listing) => void;
  onBuyClick?: (listing: Listing) => void;
}

const conditionLabel: Record<string, string> = {
  NEW: 'Mới 100%',
  LIKE_NEW: 'Như mới (99%)',
  GOOD: 'Còn đẹp (90%)',
  FAIR: 'Đã qua sử dụng',
};

export default function FeedCard({ listing, index = 0, onChatClick, onBuyClick }: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(listing.likeCount ?? 0);
  const [showHeart, setShowHeart] = useState(false);
  const isPriority = index < 2; // LCP optimization: first 2 cards load eagerly

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
    }
  };

  const handleLikeBtn = (e: React.MouseEvent) => {
    e.preventDefault();
    setLiked((l) => !l);
    setLikeCount((c) => liked ? c - 1 : c + 1);
  };

  return (
    <article className="bg-white border-b border-slate-100 animate-slide-up">
      {/* Seller header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${listing.seller.id}`} className="relative">
          <Image
            src={listing.seller.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${listing.seller.id}`}
            alt={listing.seller.username}
            width={40}
            height={40}
            className="rounded-full ring-2 ring-emerald-400/30"
          />
          {listing.seller.isVerified && (
            <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-emerald-500" />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {listing.seller.username}
            </span>
            {listing.seller.isVerified && (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                ✓ Uy tín
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {listing.seller.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>{listing.seller.totalDeals} giao dịch</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {listing.location.district}
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-400">{timeAgo(listing.createdAt)}</span>
      </div>

      {/* Product image — fixed aspect ratio to prevent CLS */}
      <div
        className="relative aspect-square w-full cursor-pointer overflow-hidden bg-slate-100"
        onDoubleClick={handleDoubleTap}
      >
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          priority={isPriority}
          sizes="(max-width: 768px) 100vw, 480px"
        />

        {/* Image count badge */}
        {listing.images.length > 1 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Images className="h-3 w-3" />
            {listing.images.length}
          </span>
        )}

        {/* Condition badge */}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {conditionLabel[listing.condition]}
        </span>

        {/* Double-tap heart burst */}
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="heart-burst h-24 w-24 fill-white text-white drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeBtn}
            aria-label={liked ? 'Bỏ thích' : 'Thích'}
            className="flex items-center gap-1.5 transition-transform active:scale-90"
          >
            <Heart
              className={clsx('h-6 w-6 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-slate-400')}
            />
            <span className="text-sm font-medium text-slate-600">{likeCount}</span>
          </button>
          <button
            onClick={() => onChatClick?.(listing)}
            aria-label="Nhắn tin"
            className="flex items-center gap-1.5 text-slate-400 transition-transform active:scale-90 hover:text-slate-600"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="px-4 pb-2">
        <Link href={`/listings/${listing.id}`} className="block">
          <p className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-emerald-600 transition-colors">
            {listing.title}
          </p>
        </Link>
        <p className="mt-1 text-lg font-black text-emerald-600">
          {formatVND(listing.price)}
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => onChatClick?.(listing)}
          id={`chat-btn-${listing.id}`}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600 active:scale-95"
        >
          💬 Chat ngay
        </button>
        <button
          onClick={() => onBuyClick?.(listing)}
          id={`buy-btn-${listing.id}`}
          className="flex-1 gradient-primary rounded-xl py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:opacity-90 active:scale-95"
        >
          🔒 Mua với Ký quỹ
        </button>
      </div>
    </article>
  );
}
