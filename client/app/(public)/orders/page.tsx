'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package, RefreshCw, ShieldCheck } from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { formatVND } from '@/utils/formatCurrency';
import { ordersApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { Order, OrderStatus } from '@/types/order';

const statusBadge: Record<OrderStatus, { text: string; color: string }> = {
  PENDING_PAYMENT: { text: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-800' },
  LOCKED: { text: 'Đã ký quỹ an toàn', color: 'bg-emerald-100 text-emerald-800' },
  SHIPPED: { text: 'Đang vận chuyển', color: 'bg-blue-100 text-blue-800' },
  DELIVERED: { text: 'Đang kiểm tra 48h', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { text: 'Hoàn tất', color: 'bg-slate-100 text-slate-700' },
  DISPUTED: { text: 'Đang tranh chấp', color: 'bg-red-100 text-red-800' },
  REFUNDED: { text: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { text: 'Đã hủy', color: 'bg-slate-100 text-slate-500' },
};

export default function OrdersPage() {
  const { wallet } = useAuthStore();
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
  }, [wallet]);

  const filteredOrders = orders.filter((o) => {
    if (tab === 'SELL') {
      return wallet ? o.sellerWallet.toLowerCase() === wallet.toLowerCase() : true;
    }
    return true; // Show buyer / all orders
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <Header title="Đơn hàng của tôi" showLocation={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Tabs: Đơn Mua / Đơn Bán */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl max-w-sm">
          <button
            onClick={() => setTab('BUY')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              tab === 'BUY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đơn mua ({orders.length})
          </button>
          <button
            onClick={() => setTab('SELL')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              tab === 'SELL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đơn bán ({orders.filter((o) => o.sellerWallet === wallet).length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3"
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
          <div className="py-12 text-center bg-white rounded-3xl border border-red-100 p-6 shadow-xs">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm font-bold text-slate-800">{errorMsg}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 inline-flex items-center gap-1.5 gradient-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có đơn hàng nào</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Các hợp đồng ký quỹ bạn tạo sẽ xuất hiện tại đây.
            </p>
            <Link
              href="/"
              className="gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm inline-block"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredOrders.map((order) => {
              const badge = statusBadge[order.status] || statusBadge.LOCKED;
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                      <span className="font-mono text-slate-400 font-semibold">
                        #{order.id.slice(-8)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <div className="flex gap-3.5 pt-3">
                      <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                        <Image
                          src={order.listingImage}
                          alt={order.listingTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                          {order.listingTitle}
                        </h4>
                        <p className="mt-1 text-sm font-black text-emerald-600">
                          {formatVND(order.amountVnd)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Ký quỹ bảo vệ
                    </span>
                    <span className="flex items-center gap-1 hover:text-slate-600">
                      Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
