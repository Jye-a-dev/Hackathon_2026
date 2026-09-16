'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import OrderStepper from '@/components/orders/OrderStepper';
import DisputeModal from '@/components/orders/DisputeModal';
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
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [timeLeft48h, setTimeLeft48h] = useState(48 * 3600); // 48 hours in seconds

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await ordersApi.get(resolvedParams.id);
        if (data && data.id) {
          setOrder(data);
        } else {
          setOrder({
            id: resolvedParams.id,
            listingId: 'lst-001',
            listingTitle: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm OSS Fullbox 99%',
            listingImage:
              'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
            buyerWallet: 'demo_wallet_buyer',
            sellerWallet: 'demo_wallet_seller',
            amountVnd: 24500000,
            status: 'DELIVERED', // Start at DELIVERED for demonstrating 48h countdown!
            deliveredAt: new Date(Date.now() - 1000 * 3600 * 6).toISOString(), // Delivered 6 hours ago
            createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
          });
        }
      } catch (err) {
        console.warn('Cannot fetch order, initialized demo order:', err);
        setOrder({
          id: resolvedParams.id,
          listingId: 'lst-001',
          listingTitle: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm OSS Fullbox 99%',
          listingImage:
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
          buyerWallet: 'demo_wallet_buyer',
          sellerWallet: 'demo_wallet_seller',
          amountVnd: 24500000,
          status: 'DELIVERED',
          deliveredAt: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [resolvedParams.id]);

  // 48h Inspection Countdown Ticker
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

  // Actions
  const handleConfirmReceived = async () => {
    if (!order) return;
    setIsCompleting(true);
    try {
      await ordersApi.complete(order.id);
      setOrder({ ...order, status: 'COMPLETED', completedAt: new Date().toISOString() });
    } catch {
      setOrder({ ...order, status: 'COMPLETED', completedAt: new Date().toISOString() });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDisputeSubmit = async (reason: string, evidenceUrls: string[]) => {
    if (!order) return;
    try {
      await ordersApi.raiseDispute(order.id, reason, evidenceUrls);
    } catch {
      // Local demo update
    }
    setOrder({
      ...order,
      status: 'DISPUTED',
      disputeReason: reason,
      disputeEvidenceUrls: evidenceUrls,
    });
  };

  // Demo status toggler
  const handleSimulateStatus = (newStatus: OrderStatus) => {
    if (!order) return;
    setOrder({ ...order, status: newStatus });
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 space-y-4">
        <div className="skeleton h-10 w-40" />
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between glass px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => router.push('/orders')}
          aria-label="Quay lại danh sách đơn"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-slate-800">Đơn hàng #{order.id.slice(-6)}</span>
        <Link
          href={`/chat?listingId=${order.listingId}`}
          aria-label="Chat với đối tác"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-700"
        >
          <MessageCircle className="h-5 w-5 text-emerald-600" />
        </Link>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Order Stepper */}
        <OrderStepper status={order.status} />

        {/* 48h Inspection Banner (Visible when DELIVERED) */}
        {order.status === 'DELIVERED' && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm animate-pulse-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold text-emerald-900">
                  Thời gian kiểm hàng còn lại:
                </span>
              </div>
              <span className="font-mono text-base font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-xs">
                {format48hCountdown(timeLeft48h)}
              </span>
            </div>
            <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
              Bạn có <strong>48 giờ</strong> để mở hộp và dùng thử món đồ. Nếu hài lòng, hãy nhấn <em>Đã nhận đúng hàng</em> để giải ngân cho người bán. Nếu có lỗi, bạn có quyền khiếu nại để nhận lại 100% tiền.
            </p>
          </div>
        )}

        {/* Item Summary Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
          <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={order.listingImage || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32'}
              alt={order.listingTitle}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <Link href={`/listings/${order.listingId}`}>
              <h3 className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-emerald-600">
                {order.listingTitle}
              </h3>
            </Link>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm font-black text-emerald-600">
                {formatVND(order.amountVnd)}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Ký quỹ an toàn
              </span>
            </div>
          </div>
        </div>

        {/* Dispute Details if DISPUTED */}
        {order.status === 'DISPUTED' && (
          <div className="bg-white rounded-2xl p-4 border border-red-200 space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="text-sm font-bold">Chi tiết khiếu nại của người mua</h4>
            </div>
            <p className="text-xs text-slate-700 bg-red-50/60 p-3 rounded-xl border border-red-100">
              &ldquo;{order.disputeReason || 'Sản phẩm lỗi cảm biến, ống kính bị xước sâu không đúng như mô tả khi rao bán.'}&rdquo;
            </p>

            <Link
              href="/admin/disputes"
              className="block text-center text-xs font-semibold text-indigo-600 hover:underline pt-1"
            >
              👉 Mở Giao diện Trọng tài Admin để phân xử đơn này
            </Link>
          </div>
        )}

        {/* Completed Note */}
        {order.status === 'COMPLETED' && (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center space-y-1">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">Giao dịch đã hoàn tất!</h4>
            <p className="text-xs text-emerald-700">
              Tiền ký quỹ đã được giải ngân chuyển vào ví của người bán. Cảm ơn bạn đã mua bán an toàn!
            </p>
          </div>
        )}

        {/* Quick Demo Status Switcher Bar */}
        <div className="bg-slate-100 rounded-2xl p-3 text-xs space-y-2">
          <span className="font-semibold text-slate-600 block">
            ⚙️ Demo Test: Chuyển đổi trạng thái đơn hàng:
          </span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <button
              onClick={() => handleSimulateStatus('LOCKED')}
              className={`rounded-lg p-1.5 font-medium text-[11px] ${order.status === 'LOCKED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
            >
              1. Đã ký quỹ
            </button>
            <button
              onClick={() => handleSimulateStatus('SHIPPED')}
              className={`rounded-lg p-1.5 font-medium text-[11px] ${order.status === 'SHIPPED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
            >
              2. Đang giao
            </button>
            <button
              onClick={() => handleSimulateStatus('DELIVERED')}
              className={`rounded-lg p-1.5 font-medium text-[11px] ${order.status === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
            >
              3. Đã nhận (48h)
            </button>
            <button
              onClick={() => handleSimulateStatus('COMPLETED')}
              className={`rounded-lg p-1.5 font-medium text-[11px] ${order.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
            >
              4. Hoàn tất
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      {order.status === 'DELIVERED' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              onClick={() => setIsDisputeOpen(true)}
              id="dispute-btn"
              className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-100 transition active:scale-95"
            >
              Khiếu nại / Trả hàng
            </button>
            <button
              onClick={handleConfirmReceived}
              disabled={isCompleting}
              id="confirm-received-btn"
              className="flex-1 gradient-primary rounded-xl py-3 text-xs font-bold text-white shadow-lg shadow-emerald-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isCompleting ? 'Đang xử lý...' : 'Đã nhận đúng hàng (Giải ngân)'}</span>
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
