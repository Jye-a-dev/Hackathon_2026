'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ShoppingBag, Package, ArrowLeft } from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { formatVND } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';
import { ordersApi } from '@/libs/api';
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
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-889214',
      listingId: 'lst-001',
      listingTitle: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm OSS Fullbox 99%',
      listingImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
      buyerWallet: 'demo_wallet_abc123',
      sellerWallet: 'usr-hoangnam',
      amountVnd: 24500000,
      status: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 1000 * 3600 * 8).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    },
    {
      id: 'ord-772109',
      listingId: 'lst-003',
      listingTitle: 'Giày Nike Air Jordan 1 Retro High OG Chicago Lost & Found',
      listingImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80',
      buyerWallet: 'demo_wallet_abc123',
      sellerWallet: 'usr-sneakerhead',
      amountVnd: 6800000,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 1000 * 3600 * 96).toISOString(),
    },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Header title="Đơn hàng của tôi" showLocation={false} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Tabs: Đơn Mua / Đơn Bán */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setTab('BUY')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              tab === 'BUY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Đơn mua ({orders.length})
          </button>
          <button
            onClick={() => setTab('SELL')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              tab === 'SELL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Đơn bán (0)
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Bạn chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const badge = statusBadge[order.status] || statusBadge.LOCKED;
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono text-slate-400 font-medium">#{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
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
                    <ChevronRight className="h-5 w-5 text-slate-300 self-center" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
