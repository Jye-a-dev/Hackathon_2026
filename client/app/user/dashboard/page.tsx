'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowRight,
  Lock,
  Package,
} from 'lucide-react';
import { Money } from '@/domain/value-objects/Money';
import { useMyOrders, useCurrentUser } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '@/types/order';

export default function UserDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: orders = [], isLoading } = useMyOrders({
    buyerWallet: user?.id || undefined,
  });

  const stats = useMemo(() => {
    let lockedAmount = 0;
    let completedAmount = 0;
    let activeOrdersCount = 0;
    let completedOrdersCount = 0;

    orders.forEach((o: Order) => {
      if (['LOCKED', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
        lockedAmount += o.amountVnd;
        activeOrdersCount += 1;
      }
      if (o.status === 'COMPLETED') {
        completedAmount += o.amountVnd;
        completedOrdersCount += 1;
      }
    });

    return {
      lockedMoney: new Money(lockedAmount, 'VND'),
      completedMoney: new Money(completedAmount, 'VND'),
      activeOrdersCount,
      completedOrdersCount,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200/80 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          Tổng Quan Tài Khoản
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Quản lý số dư ký quỹ an toàn, đơn hàng đang đếm ngược 48h và lịch sử thanh toán.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Tiền Đang Được Khóa Ký Quỹ</span>
            <Lock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono">
            {isLoading ? <Skeleton className="h-8 w-32" /> : stats.lockedMoney.format()}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Được bảo vệ 100% tại Solana Vault
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Đơn Hàng Đang Giao Dịch</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono">
            {isLoading ? <Skeleton className="h-8 w-16" /> : `${stats.activeOrdersCount} đơn`}
          </div>
          <p className="text-[11px] text-neutral-500">
            Bao gồm đơn đang vận chuyển & kiểm 48h
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Tổng Giao Dịch Thành Công</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono">
            {isLoading ? <Skeleton className="h-8 w-32" /> : stats.completedMoney.format()}
          </div>
          <p className="text-[11px] text-neutral-500">
            {stats.completedOrdersCount} đơn hàng đã hoàn tất
          </p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/user/orders"
          className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs hover:border-neutral-300 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition">
                Theo dõi đơn mua ký quỹ
              </div>
              <div className="text-[11px] text-neutral-400">
                Xác nhận hàng hoặc mở khiếu nại trong 48h
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/sell"
          className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs hover:border-neutral-300 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition">
                Đăng bán sản phẩm mới
              </div>
              <div className="text-[11px] text-neutral-400">
                Khóa cược an toàn, nhận tiền tức thì sau 48h
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

