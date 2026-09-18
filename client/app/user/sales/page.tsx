'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { useMyOrders, useCurrentUser } from '@/hooks/useMarketplace';
import { ordersApi } from '@/libs/api';
import { timeAgo } from '@/utils/formatTime';
import type { Order, OrderStatus } from '@/types/order';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

type TabKey = 'ALL' | 'LOCKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED';

const TABS: { id: TabKey; label: string }[] = [
  { id: 'ALL',       label: 'Tất cả' },
  { id: 'LOCKED',    label: 'Chờ giao hàng' },
  { id: 'SHIPPED',   label: 'Đang vận chuyển' },
  { id: 'DELIVERED', label: 'Đang đếm ngược 48h' },
  { id: 'COMPLETED', label: 'Hoàn tất' },
  { id: 'DISPUTED',  label: 'Khiếu nại' },
];

function Countdown48h({ deliveredAt }: { deliveredAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!deliveredAt) return;
    const updateCountdown = () => {
      const deliveredTime = new Date(deliveredAt).getTime();
      const expireTime = deliveredTime + 48 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeLeft('Đã hết 48h - Sẵn sàng giải ngân');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [deliveredAt]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
      <Timer className="h-3.5 w-3.5 text-emerald-600 shrink-0 animate-pulse" />
      <span>Giải ngân sau: <strong className="font-mono text-emerald-950">{timeLeft}</strong></span>
    </div>
  );
}

const STATUS_PILL: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', cls: 'bg-neutral-100 text-neutral-600' },
  LOCKED:          { label: 'Chờ giao hàng',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  SHIPPED:         { label: 'Đang vận chuyển', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  DELIVERED:       { label: 'Đếm ngược 48h',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  COMPLETED:       { label: 'Hoàn tất',       cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  DISPUTED:        { label: 'Khiếu nại',      cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
  REFUNDED:        { label: 'Đã hoàn tiền',   cls: 'bg-neutral-100 text-neutral-600' },
  CANCELLED:       { label: 'Đã hủy',         cls: 'bg-neutral-100 text-neutral-500' },
};

function TrackingModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { toast.error('Nhập mã vận đơn'); return; }
    setLoading(true);
    try {
      await ordersApi.markDelivered(orderId, code.trim());
      toast.success('Đã cập nhật mã vận đơn & chuyển trạng thái Đang giao!');
      onClose();
    } catch {
      toast.error('Không thể cập nhật. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-200/80 shadow-2xl p-6">
        <h3 className="font-bold text-neutral-900 mb-1">Nhập mã vận đơn</h3>
        <p className="text-xs text-neutral-500 mb-4">GHN, J&T, Viettel Post, GHTK...</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VD: GHN12345678"
            className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Xác nhận giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserSalesPage() {
  const { data: user } = useCurrentUser();
  const sellerWallet = user?.wallet || user?.id;

  const { data: orders = [], isLoading, refetch } = useMyOrders({ sellerWallet });

  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // Metrics
  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + o.amountVnd, 0),
    [orders],
  );
  const inEscrow = useMemo(
    () => orders.filter((o) => ['LOCKED', 'SHIPPED', 'DELIVERED'].includes(o.status)).reduce((s, o) => s + o.amountVnd, 0),
    [orders],
  );
  const readyToWithdraw = useMemo(
    () => orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + o.amountVnd, 0),
    [orders],
  );

  const tabCount = (id: TabKey) =>
    id === 'ALL' ? orders.length : orders.filter((o) => o.status === id).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight">Đơn bán &amp; Doanh thu</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Quản lý đơn hàng &amp; theo dõi giải ngân ký quỹ</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition shadow-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100">
              <TrendingUp className="h-4 w-4 text-neutral-600" />
            </div>
            <span className="text-xs font-semibold text-neutral-500">Tổng doanh thu</span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900">{fmt(totalRevenue)}</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Tất cả đơn hoàn tất</div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-amber-700">Đang ký quỹ</span>
          </div>
          <div className="text-xl font-extrabold text-amber-900">{fmt(inEscrow)}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Chờ người mua kiểm tra</div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-700">Sẵn sàng rút tiền</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-900">{fmt(readyToWithdraw)}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Đã giải ngân về tài khoản</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto [scrollbar-width:none] gap-1 bg-neutral-100 rounded-2xl p-1">
        {TABS.map(({ id, label }) => {
          const count = tabCount(id);
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition shrink-0',
                activeTab === id
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900',
              )}
            >
              {label}
              {count > 0 && (
                <span className={clsx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', activeTab === id ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600')}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Package className="h-7 w-7 text-neutral-400" />
          </div>
          <div>
            <p className="font-semibold text-neutral-700">Chưa có đơn hàng nào</p>
            <p className="text-xs text-neutral-400 mt-1">Khi có người mua đặt hàng, đơn sẽ xuất hiện ở đây</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: Order) => {
            const pill = STATUS_PILL[order.status] ?? { label: order.status, cls: 'bg-neutral-100 text-neutral-600' };
            return (
              <div key={order.id} className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs hover:shadow-sm transition">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                    {order.listingImage ? (
                      <Image src={order.listingImage} alt={order.listingTitle} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900 line-clamp-1">{order.listingTitle}</p>
                      <span className={clsx('shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold', pill.cls)}>
                        {pill.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span>Người mua: <strong className="text-neutral-700 font-mono text-[10px]">{order.buyerWallet.slice(0, 8)}…</strong></span>
                      <span>·</span>
                      <span>{timeAgo(order.createdAt)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-neutral-900">{fmt(order.amountVnd)}</span>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {order.status === 'LOCKED' && (
                          <button
                            onClick={() => setTrackingOrderId(order.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-[11px] font-bold text-white transition"
                          >
                            <Truck className="h-3 w-3" />
                            Nhập vận đơn
                          </button>
                        )}
                        {order.status === 'DISPUTED' && (
                          <span className="flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                            <AlertTriangle className="h-3 w-3" />
                            Đang tranh chấp
                          </span>
                        )}
                        <Link
                          href={`/user/orders?order=${order.id}`}
                          className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Chi tiết
                        </Link>
                        <button className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 transition">
                          <MessageCircle className="h-3 w-3" />
                          Chat
                        </button>
                      </div>
                    </div>

                    {/* Tracking code */}
                    {order.trackingCode && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">
                        <Truck className="h-3 w-3 shrink-0" />
                        <span>Mã vận đơn: <strong className="font-mono">{order.trackingCode}</strong></span>
                      </div>
                    )}

                    {/* 48h Escrow Countdown ticker */}
                    {order.status === 'DELIVERED' && (
                      <Countdown48h deliveredAt={order.deliveredAt || order.createdAt} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Escrow help banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-800">
          <strong>Quy trình giải ngân Ký quỹ 48h:</strong> Tiền được khóa an toàn → Bạn gửi hàng &amp; nhập mã vận đơn → Người mua kiểm tra 48h → Hệ thống tự động giải ngân về tài khoản ngân hàng của bạn.
        </div>
      </div>

      {/* Tracking modal */}
      {trackingOrderId && (
        <TrackingModal orderId={trackingOrderId} onClose={() => { setTrackingOrderId(null); refetch(); }} />
      )}
    </div>
  );
}

