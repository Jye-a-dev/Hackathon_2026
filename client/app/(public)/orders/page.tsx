'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatVND } from '@/utils/formatCurrency';
import { ordersApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { Order, OrderStatus } from '@/types/order';

const statusBadge: Record<OrderStatus, { text: string; color: string }> = {
  PENDING_PAYMENT: { text: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-800' },
  LOCKED: { text: 'Đã ký quỹ an toàn', color: 'bg-emerald-100 text-emerald-800' },
  SHIPPED: { text: 'Đang vận chuyển', color: 'bg-blue-100 text-blue-800' },
  DELIVERED: { text: 'Đang kiểm tra 48h', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { text: 'Hoàn tất', color: 'bg-neutral-100 text-neutral-700' },
  DISPUTED: { text: 'Đang tranh chấp', color: 'bg-rose-100 text-rose-800' },
  REFUNDED: { text: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { text: 'Đã hủy', color: 'bg-neutral-100 text-neutral-500' },
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const allOrders = await ordersApi.list();
      setOrders(allOrders);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const filteredOrders = orders.filter((o) => {
    if (tab === 'SELL') {
      return user?.id ? o.sellerWallet.toLowerCase() === user.id.toLowerCase() : true;
    }
    return true;
  });

  return (
    <div className="w-full max-w-full pb-24 md:pb-12">
      <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              Đơn hàng ký quỹ
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Quản lý toàn bộ tiến trình khóa quỹ và giao dịch 48h
            </p>
          </div>

          {/* Tabs: Đơn Mua / Đơn Bán */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl max-w-xs">
            <button
              onClick={() => setTab('BUY')}
              className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition ${
                tab === 'BUY'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Đơn mua ({orders.length})
            </button>
            <button
              onClick={() => setTab('SELL')}
              className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition ${
                tab === 'SELL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Đơn bán ({orders.filter((o) => user?.id && o.sellerWallet === user.id).length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3"
              >
                <div className="skeleton h-4 w-32" />
                <div className="flex gap-3">
                  <div className="skeleton h-16 w-16 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-5 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs max-w-md mx-auto">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-neutral-800">{errorMsg}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-xs max-w-md mx-auto">
            <Package className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-800">Chưa có đơn hàng nào</p>
            <p className="text-xs text-neutral-500 mt-1 mb-5">
              Các hợp đồng ký quỹ bạn tạo sẽ xuất hiện tại đây.
            </p>
            <Link
              href="/"
              className="bg-neutral-900 hover:bg-neutral-800 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs inline-block"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const badge = statusBadge[order.status] || statusBadge.LOCKED;
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/80 hover:border-neutral-400 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 text-xs">
                      <span className="font-mono text-neutral-500 font-semibold">
                        #{order.id.slice(-8)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <div className="flex gap-3.5 pt-3">
                      <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
                        {order.listingImage ? (
                          <Image
                            src={order.listingImage}
                            alt={order.listingTitle}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 line-clamp-2">
                          {order.listingTitle}
                        </h4>
                        <p className="mt-1 text-sm font-extrabold text-emerald-600 font-sans">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amountVnd)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Ký quỹ bảo vệ
                    </span>
                    <span className="flex items-center gap-1 text-neutral-600 font-medium">
                      Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
