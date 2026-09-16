'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Share2,
  Heart,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import ImageCarousel from '@/components/common/ImageCarousel';
import EscrowBadge from '@/components/common/EscrowBadge';
import { formatVND } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';
import { listingsApi, ordersApi } from '@/libs/api';
import { MOCK_LISTINGS } from '@/constants/mockData';
import { useAuthStore } from '@/store/useAuthStore';
import type { Listing } from '@/types/listing';

const conditionMap: Record<string, { label: string; desc: string }> = {
  NEW: { label: 'Mới 100%', desc: 'Chưa bóc seal, đầy đủ phụ kiện hộp' },
  LIKE_NEW: { label: 'Như mới (99%)', desc: 'Dùng lướt, không trầy xước cấn móp' },
  GOOD: { label: 'Còn đẹp (90%)', desc: 'Có dấu hiệu sử dụng nhẹ, tính năng hoàn hảo' },
  FAIR: { label: 'Đã qua sử dụng', desc: 'Ngoại hình cũ theo thời gian, mọi chức năng tốt' },
};

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { wallet } = useAuthStore();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await listingsApi.get(resolvedParams.id);
        if (data && data.id) {
          setListing(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Cannot fetch listing from server, using fallback mock:', e);
      }

      // Fallback to mock data matching id, or first mock item
      const found =
        MOCK_LISTINGS.find((item) => item.id === resolvedParams.id) ||
        MOCK_LISTINGS[0];
      setListing(found);
      setLoading(false);
    }

    loadListing();
  }, [resolvedParams.id]);

  const handleCreateOrder = async () => {
    if (!listing) return;
    setIsOrdering(true);

    try {
      const buyerWallet = wallet || 'demo_buyer_wallet';
      const order = await ordersApi.create({
        listingId: listing.id,
        buyerWallet,
        sellerWallet: listing.seller.id,
        amountVnd: listing.price,
      });

      router.push(`/checkout/${order.id}`);
    } catch (err) {
      console.warn('Error creating order with backend, creating local demo order:', err);
      // Fallback demo order ID
      const mockOrderId = `ord-${Date.now()}`;
      router.push(`/checkout/${mockOrderId}?amount=${listing.price}&title=${encodeURIComponent(listing.title)}`);
    } finally {
      setIsOrdering(false);
    }
  };

  const handleChat = () => {
    if (!listing) return;
    router.push(`/chat?listingId=${listing.id}&seller=${listing.seller.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="skeleton aspect-square w-full rounded-2xl mb-4" />
        <div className="skeleton h-6 w-3/4 mb-2" />
        <div className="skeleton h-8 w-1/3 mb-6" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-4xl mb-2">📦</p>
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy món đồ</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Món đồ có thể đã bán hoặc ngừng giao dịch.</p>
        <Link href="/" className="gradient-primary rounded-xl px-6 py-2.5 text-white font-semibold">
          Quay lại Khám phá
        </Link>
      </div>
    );
  }

  const cond = conditionMap[listing.condition] || conditionMap.GOOD;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Floating Top Nav */}
      <header className="sticky top-0 z-40 flex items-center justify-between glass px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => router.back()}
          aria-label="Quay lại"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-700">Chi tiết sản phẩm</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            aria-label="Yêu thích"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50"
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: listing.title, url: window.location.href });
              }
            }}
            aria-label="Chia sẻ"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-600"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main image carousel */}
      <div className="bg-black">
        <ImageCarousel images={listing.images} alt={listing.title} aspectRatio="aspect-[4/3]" />
      </div>

      <div className="p-4 space-y-4">
        {/* Price & Title */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {formatVND(listing.price)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {cond.label}
            </span>
          </div>

          <h1 className="mt-2 text-lg font-bold text-slate-900 leading-snug">
            {listing.title}
          </h1>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {listing.location.district}, {listing.location.city}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Đăng {timeAgo(listing.createdAt)}
            </span>
          </div>
        </div>

        {/* Escrow Guarantee Banner */}
        <EscrowBadge variant="full" />

        {/* Seller Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={listing.seller.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${listing.seller.id}`}
                alt={listing.seller.username}
                width={48}
                height={48}
                className="rounded-full ring-2 ring-emerald-500/20 object-cover"
              />
              {listing.seller.isVerified && (
                <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white text-emerald-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-sm">{listing.seller.username}</span>
                {listing.seller.isVerified && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                    Xác thực
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {listing.seller.rating.toFixed(1)}
                </span>
                <span>•</span>
                <span>{listing.seller.totalDeals} đơn thành công</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleChat}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
          >
            Nhắn tin
          </button>
        </div>

        {/* Description & Condition Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Mô tả sản phẩm</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {listing.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
          </p>

          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">Tình trạng thực tế:</h3>
            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{cond.desc}</span>
            </div>
          </div>
        </div>

        {/* How Escrow Works Note */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Quy trình mua hàng an toàn:
          </p>
          <p>1. Bạn chuyển khoản ký quỹ vào tài khoản trung gian được bảo đảm.</p>
          <p>2. Người bán gửi hàng cho bạn kèm mã vận đơn.</p>
          <p>3. Bạn có <strong>48 giờ kiểm tra</strong> sau khi nhận hàng trước khi tiền được chuyển cho người bán.</p>
        </div>
      </div>

      {/* Fixed Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={handleChat}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-600 transition active:scale-95"
          >
            <span>💬 Chat</span>
          </button>
          <button
            onClick={handleCreateOrder}
            disabled={isOrdering}
            id="order-escrow-btn"
            className="flex-1 gradient-primary rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:opacity-95 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isOrdering ? 'Đang tạo đơn...' : 'Đặt mua với Ký quỹ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
