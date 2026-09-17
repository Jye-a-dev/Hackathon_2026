'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  ShieldCheck,
  Package,
  RefreshCw,
} from 'lucide-react';
import OrderStepper from '@/components/orders/OrderStepper';
import DisputeModal from '@/components/orders/DisputeModal';
import Header from '@/components/common/Header';
import { formatVND } from '@/utils/formatCurrency';
import { format48hCountdown } from '@/utils/formatTime';
import { ordersApi } from '@/libs/api';
import type { Order, OrderStatus } from '@/types/order';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [timeLeft48h, setTimeLeft48h] = useState(48 * 3600);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await ordersApi.get(resolvedParams.id, true);
      if (data && data.id) {
        setOrder(data);

        // Calculate actual remaining 48h if delivered
        if (data.deliveredAt) {
          const elapsedSec = (Date.now() - new Date(data.deliveredAt).getTime()) / 1000;
          const remain = Math.max(0, Math.floor(48 * 3600 - elapsedSec));
          setTimeLeft48h(remain);
        }
      } else {
        setErrorMsg('Không tìm thấy đơn hàng trên hệ thống');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [resolvedParams.id]);

  // 48h Countdown Ticker
  useEffect(() => {
    if (!order || order.status !== 'DELIVERED') return;

    const timer = setInterval(() => {
      setTimeLeft48h((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const handleConfirmReceived = async () => {
    if (!order) return;
    setIsCompleting(true);
    try {
      const updated = await ordersApi.complete(order.id);
      setOrder(updated);
    } catch (err: any) {
      alert('Không thể hoàn tất đơn hàng: ' + (err?.message || 'Lỗi'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDisputeSubmit = async (reason: string, evidenceUrls: string[]) => {
    if (!order) return;
    try {
      const updated = await ordersApi.raiseDispute(order.id, reason, evidenceUrls);
      setOrder(updated);
      setIsDisputeOpen(false);
    } catch (err: any) {
      alert('Lỗi gửi khiếu nại: ' + (err?.message || 'Lỗi'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showLocation={false} />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="skeleton h-8 w-40 rounded-xl" />
          <div className="skeleton h-24 w-full rounded-3xl" />
          <div className="skeleton h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showLocation={false} />
        <div className="max-w-md mx-auto my-16 bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-bold text-slate-800">
            {errorMsg || 'Không tìm thấy đơn hàng'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Mã đơn hàng không hợp lệ hoặc đã bị xóa.
          </p>
          <Link
            href="/orders"
            className="gradient-primary rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200"
          >
            Quay lại danh sách đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <Header showLocation={false} title={`Đơn hàng #${order.id.slice(-6)}`} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Back link & actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Danh sách đơn hàng</span>
          </button>
          <Link
            href={`/chat?listingId=${order.listingId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat với đối tác</span>
          </Link>
        </div>

        {/* Order Stepper */}
        <OrderStepper status={order.status} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column (Details, 48h Banner, Dispute info) */}
          <div className="md:col-span-7 space-y-4">
            {/* 48h Inspection Banner (Visible when DELIVERED) */}
            {order.status === 'DELIVERED' && (
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-xs animate-pulse-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-bold text-emerald-900">
                      Thời gian kiểm hàng còn lại:
                    </span>
                  </div>
                  <span className="font-mono text-base font-black text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                    {format48hCountdown(timeLeft48h)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
                  Bạn có <strong>48 giờ</strong> để kiểm tra kỹ sản phẩm. Nếu đúng mô tả, hãy bấm <em>Đã nhận đúng hàng</em> để giải ngân. Nếu phát hiện lỗi, bạn có quyền khiếu nại để nhận lại 100% tiền.
                </p>
              </div>
            )}

            {/* Dispute Details if DISPUTED */}
            {order.status === 'DISPUTED' && (
              <div className="bg-white rounded-3xl p-5 border border-red-200 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="text-sm font-bold">Đơn hàng đang có tranh chấp</h4>
                </div>
                <p className="text-xs text-slate-700 bg-red-50/60 p-3.5 rounded-2xl border border-red-100">
                  &ldquo;{order.disputeReason || 'Sản phẩm phát sinh lỗi hoặc không đúng mô tả khi nhận hàng.'}&rdquo;
                </p>
                <Link
                  href="/admin/disputes"
                  className="block text-center text-xs font-bold text-indigo-600 hover:underline pt-1"
                >
                  👉 Mở Cổng Trọng Tài Phân Xử để kiểm tra tiến trình
                </Link>
              </div>
            )}

            {/* Completed Note */}
            {order.status === 'COMPLETED' && (
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200 text-center space-y-1 shadow-xs">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Giao dịch đã hoàn tất!</h4>
                <p className="text-xs text-emerald-700">
                  Tiền ký quỹ đã được giải ngân chuyển cho người bán. Hợp đồng ký quỹ hoàn thành.
                </p>
              </div>
            )}

            {/* Contract Info Card */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thông tin Hợp đồng Ký quỹ
              </h4>
              <div className="space-y-2 text-xs divide-y divide-slate-50">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-slate-800">#{order.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Ví người mua:</span>
                  <span className="font-mono text-slate-700 truncate max-w-[200px]">
                    {order.buyerWallet}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Ví người bán:</span>
                  <span className="font-mono text-slate-700 truncate max-w-[200px]">
                    {order.sellerWallet}
                  </span>
                </div>
                {order.trackingCode && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Mã vận đơn:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {order.trackingCode}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Thời gian tạo:</span>
                  <span className="text-slate-700">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Item Summary & Actions */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex gap-4">
              <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <Image
                  src={order.listingImage}
                  alt={order.listingTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-slate-800 line-clamp-2">
                  {order.listingTitle}
                </h3>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-base font-black text-emerald-600">
                    {formatVND(order.amountVnd)}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Ký quỹ an toàn
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            {order.status === 'DELIVERED' && (
              <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Thao tác người mua</h4>
                <button
                  onClick={handleConfirmReceived}
                  disabled={isCompleting}
                  className="gradient-primary w-full rounded-2xl py-3 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:opacity-95 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isCompleting ? 'Đang xử lý...' : 'Đã nhận đúng hàng (Giải ngân)'}</span>
                </button>
                <button
                  onClick={() => setIsDisputeOpen(true)}
                  className="w-full rounded-2xl border border-red-200 bg-red-50/70 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                >
                  Yêu cầu Khiếu nại / Trả hàng
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Action Bar */}
      {order.status === 'DELIVERED' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              onClick={() => setIsDisputeOpen(true)}
              className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-100 transition active:scale-95"
            >
              Khiếu nại
            </button>
            <button
              onClick={handleConfirmReceived}
              disabled={isCompleting}
              className="flex-1 gradient-primary rounded-xl py-3 text-xs font-bold text-white shadow-lg shadow-emerald-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isCompleting ? 'Đang xử lý...' : 'Đã nhận đúng hàng'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        onSubmit={handleDisputeSubmit}
        orderId={order.id}
      />
    </div>
  );
}
