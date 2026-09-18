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
  MessageCircle,
  PackageSearch,
} from 'lucide-react';
import ImageCarousel from '@/components/common/ImageCarousel';
import EscrowBadge from '@/components/common/EscrowBadge';
import { Money } from '@/domain/value-objects/Money';
import { timeAgo } from '@/utils/formatTime';
import { listingsApi, ordersApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentUser } from '@/hooks/useMarketplace';
import { toast } from 'sonner';
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
  const { isLoggedIn, user: storeUser } = useAuthStore();
  const { data: currentUser } = useCurrentUser();
  const user = currentUser || storeUser;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const isOwner = Boolean(
    currentUser &&
      listing && (
        currentUser.id === listing.sellerId ||
        (currentUser as any).walletAddress === listing.sellerWallet ||
        (currentUser as any).wallet_address === listing.sellerWallet ||
        currentUser.id === listing.userId ||
        currentUser.id === listing.seller?.id ||
        (currentUser as any).wallet === listing.seller?.id ||
        (currentUser as any).wallet_address === listing.seller?.id ||
        (currentUser as any).walletAddress === listing.seller?.id
      ),
  );

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await listingsApi.get(resolvedParams.id);
        if (data && data.id) {
          setListing(data);
        } else {
          setErrorMsg('Không tìm thấy sản phẩm trên hệ thống');
        }
      } catch (e: any) {
        setErrorMsg(e?.message || 'Không thể tải thông tin sản phẩm từ máy chủ');
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [resolvedParams.id]);

  const handleCreateOrder = async () => {
    if (!listing || isOwner) return;
    if (!isLoggedIn || !user?.id) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      router.push('/auth/login');
      return;
    }
    setIsOrdering(true);

    try {
      const order = await ordersApi.create({
        listingId: listing.id,
        buyerWallet: user.id,
        sellerWallet: listing.seller.id,
        amountVnd: listing.price,
      });

      router.push(`/checkout/${order.id}`);
    } catch (err: any) {
      toast.error('Không thể khởi tạo giao dịch ký quỹ: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setIsOrdering(false);
    }
  };

  const handleChat = () => {
    if (!listing || isOwner) return;
    router.push(`/chat?listingId=${listing.id}&seller=${listing.seller.id}`);
  };

  const handleCloseListing = async () => {
    if (!listing) return;
    try {
      setIsClosing(true);
      await listingsApi.updateStatus(listing.id, 'SOLD');
      setListing((prev) => (prev ? { ...prev, status: 'SOLD' } : null));
      toast.success('Đã cập nhật trạng thái bài đăng thành Đã bán');
    } catch (err: any) {
      toast.error('Không thể cập nhật trạng thái bài đăng: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-full min-h-[70vh] py-8">
        <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 md:grid md:grid-cols-2 md:gap-8">
          <div className="skeleton aspect-[4/5] sm:aspect-square w-full rounded-3xl mb-4" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-1/3 rounded-xl" />
            <div className="skeleton h-6 w-3/4 rounded-xl" />
            <div className="skeleton h-24 w-full rounded-2xl" />
            <div className="skeleton h-36 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="w-full max-w-full min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-8 lg:px-12">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-xs text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <PackageSearch className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">
            {errorMsg || 'Không tìm thấy sản phẩm'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 mb-6">
            Món đồ có thể đã bán hoặc ID không tồn tại trên cơ sở dữ liệu.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition"
          >
            Quay lại Khám phá
          </Link>
        </div>
      </div>
    );
  }

  const cond = conditionMap[listing.condition] || conditionMap.GOOD;

  return (
    <div className="w-full max-w-full pb-24 md:pb-12">
      <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {/* Breadcrumb & back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              aria-label="Yêu thích"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:bg-neutral-50 text-neutral-700 transition"
            >
              <Heart
                className={`h-4 w-4 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-600'
                }`}
              />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: listing.title,
                    url: window.location.href,
                  });
                }
              }}
              aria-label="Chia sẻ"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:bg-neutral-50 text-neutral-600 transition"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Column: Image gallery */}
          <div className="md:col-span-6 lg:col-span-7">
            <div className="bg-neutral-950 rounded-3xl overflow-hidden shadow-xs sticky top-24">
              <ImageCarousel
                images={listing.images}
                alt={listing.title}
                aspectRatio="aspect-[4/5] sm:aspect-square"
              />
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="md:col-span-6 lg:col-span-5 space-y-4">
            {/* Price & Title Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-neutral-200/80">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-black text-neutral-950 font-sans">
                  {new Money(listing.price, 'VND').format()}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/50">
                  {cond.label}
                </span>
              </div>

              <h1 className="mt-3 text-lg sm:text-xl font-bold text-neutral-900 leading-snug">
                {listing.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                  {listing.location.district}, {listing.location.city}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  Đăng {timeAgo(listing.createdAt)}
                </span>
              </div>
            </div>

            {/* Escrow Guarantee Banner */}
            <EscrowBadge variant="full" />

            {/* Desktop Action Box */}
            <div className="hidden md:flex flex-col gap-3 bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/80">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Trạng thái sản phẩm:</span>
                <span className={`font-bold ${listing.status === 'SOLD' ? 'text-neutral-500' : 'text-emerald-600'}`}>
                  {listing.status === 'SOLD' ? 'Đã bán / Đã đóng' : 'Sẵn sàng giao dịch'}
                </span>
              </div>
              {isOwner ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-center">
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg font-medium">
                      Đây là tin đăng của bạn
                    </span>
                  </div>
                  <Link
                    href={`/sell?edit=${listing.id}`}
                    className="w-full rounded-2xl bg-neutral-900 hover:bg-neutral-800 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-98 flex items-center justify-center gap-2 text-center"
                  >
                    Chỉnh sửa tin đăng
                  </Link>
                  <button
                    type="button"
                    onClick={handleCloseListing}
                    disabled={isClosing || listing.status === 'SOLD'}
                    className="w-full rounded-2xl border border-neutral-200 bg-white py-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {listing.status === 'SOLD' ? 'Tin đã đóng' : 'Đóng bài đăng / Đã bán'}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleCreateOrder}
                    disabled={isOrdering}
                    className="w-full rounded-2xl bg-neutral-900 hover:bg-neutral-800 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>{isOrdering ? 'Đang tạo hợp đồng...' : 'Đặt mua với Ký quỹ'}</span>
                  </button>
                  <button
                    onClick={handleChat}
                    className="w-full rounded-2xl border border-neutral-200 bg-white py-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Nhắn tin cho người bán</span>
                  </button>
                </>
              )}
            </div>

            {/* Seller Info Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={
                      listing.seller.avatarUrl ??
                      `https://api.dicebear.com/9.x/avataaars/svg?seed=${listing.seller.id}`
                    }
                    alt={listing.seller.username}
                    width={48}
                    height={48}
                    className="rounded-full ring-2 ring-neutral-200 object-cover"
                    unoptimized
                  />
                  {listing.seller.isVerified && (
                    <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white text-emerald-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-neutral-800 text-sm">
                      {listing.seller.username}
                    </span>
                    {listing.seller.isVerified && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        Xác thực
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                    {listing.seller.rating !== undefined && (
                      <>
                        <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(listing.seller.rating).toFixed(1)}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>{listing.seller.totalDeals ?? 0} đơn thành công</span>
                  </div>
                </div>
              </div>

              {!isOwner && (
                <button
                  onClick={handleChat}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Nhắn tin</span>
                </button>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/80 space-y-3">
              <h2 className="text-sm font-bold text-neutral-900">Mô tả sản phẩm</h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {listing.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </p>

              <div className="border-t border-neutral-100 pt-3">
                <h3 className="text-xs font-semibold text-neutral-700 mb-1.5">
                  Tình trạng kiểm định:
                </h3>
                <div className="flex items-start gap-2 bg-neutral-50 rounded-2xl p-3 text-xs text-neutral-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{cond.desc}</span>
                </div>
              </div>
            </div>

            {/* Escrow Process Walkthrough */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-4 text-xs text-emerald-800 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Quy trình mua hàng an toàn:
              </p>
              <p>1. Bạn chuyển tiền vào tài khoản Ký quỹ An toàn bảo chứng.</p>
              <p>2. Người bán đóng gói và gửi hàng kèm mã vận đơn.</p>
              <p>
                3. Bạn có <strong>48 giờ kiểm hàng thực tế</strong> trước khi giải ngân cho người bán.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom CTA Bar for Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {isOwner ? (
            <>
              <span className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
                Đây là tin đăng của bạn
              </span>
              <Link
                href={`/sell?edit=${listing.id}`}
                className="flex-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-xs font-bold text-white shadow-xs transition active:scale-98 flex items-center justify-center text-center"
              >
                Chỉnh sửa tin đăng
              </Link>
              <button
                type="button"
                onClick={handleCloseListing}
                disabled={isClosing || listing.status === 'SOLD'}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition active:scale-95 whitespace-nowrap disabled:opacity-50"
              >
                {listing.status === 'SOLD' ? 'Đã đóng' : 'Đóng bài đăng'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleChat}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={isOrdering}
                id="order-escrow-btn"
                className="flex-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-sm font-bold text-white shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{isOrdering ? 'Đang tạo hợp đồng...' : 'Đặt mua với Ký quỹ'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
