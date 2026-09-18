'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  RefreshCw,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Ban,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { Money } from '@/domain/value-objects/Money';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { EscrowOrder, EscrowStatus } from '@/domain/entities/EscrowOrder';
import {
  useAdminEscrowList,
  useCompleteOrder,
  useCancelOrder,
} from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { timeAgo } from '@/utils/formatTime';
import type { Order } from '@/types/order';

const STATUS_PILLS: Record<string, { label: string; badgeClass: string }> = {
  LOCKED: {
    label: 'Khóa quỹ',
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80',
  },
  DELIVERED: {
    label: 'Đang kiểm 48h',
    badgeClass: 'bg-amber-950/80 text-amber-400 border border-amber-800/80',
  },
  COMPLETED: {
    label: 'Đã giải ngân',
    badgeClass: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
  },
  DISPUTED: {
    label: 'Đang khiếu nại',
    badgeClass: 'bg-rose-950/80 text-rose-400 border border-rose-800/80',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-purple-950/80 text-purple-400 border border-purple-800/80',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-neutral-900 text-neutral-500 border border-neutral-800',
  },
};

export default function AdminEscrowPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // TanStack Query: Fetch live orders from NestJS /orders endpoint
  const { data: orders = [], isLoading, isRefetching, refetch } = useAdminEscrowList({
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
  });

  const completeMutation = useCompleteOrder();
  const cancelMutation = useCancelOrder();

  // Convert raw API DTOs into Rich Domain Entities
  const domainOrders = useMemo(() => {
    return orders.map((o: Order) => {
      return {
        raw: o,
        entity: new EscrowOrder(
          o.id,
          o.buyerWallet,
          o.sellerWallet,
          new Money(o.amountVnd, 'VND'),
          o.status as EscrowStatus,
          o.deliveredAt ? new Date(o.deliveredAt) : undefined,
          172800,
        ),
      };
    });
  }, [orders]);

  // Client-side search by Order ID / Buyer / Seller
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return domainOrders;
    return domainOrders.filter(({ raw }) => {
      return (
        raw.id.toLowerCase().includes(q) ||
        raw.buyerWallet?.toLowerCase().includes(q) ||
        raw.sellerWallet?.toLowerCase().includes(q) ||
        raw.listingTitle?.toLowerCase().includes(q)
      );
    });
  }, [domainOrders, searchQuery]);

  // Aggregate Real-time Analytical Metrics
  const metrics = useMemo(() => {
    let totalLockedVnd = 0;
    let deliveredCount = 0;
    let expiredCrankerCount = 0;

    domainOrders.forEach(({ entity, raw }) => {
      if (entity.isProtectedByEscrow()) {
        totalLockedVnd += raw.amountVnd;
      }
      if (raw.status === 'DELIVERED') {
        deliveredCount += 1;
        const timer = entity.getTimer();
        if (timer && timer.isExpired()) {
          expiredCrankerCount += 1;
        }
      }
    });

    return {
      totalLockedMoney: new Money(totalLockedVnd, 'VND'),
      deliveredCount,
      expiredCrankerCount,
      totalCount: domainOrders.length,
    };
  }, [domainOrders]);

  const handleEmergencyRelease = async (orderId: string) => {
    if (!confirm(`Xác nhận kích hoạt giải ngân khẩn cấp cho đơn hàng #${orderId}?`)) return;
    setProcessingOrderId(orderId);
    try {
      await completeMutation.mutateAsync(orderId);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleEmergencyFreeze = async (orderId: string) => {
    if (!confirm(`Xác nhận đóng băng và hủy đơn hàng #${orderId} để bảo toàn quỹ?`)) return;
    setProcessingOrderId(orderId);
    try {
      await cancelMutation.mutateAsync(orderId);
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-emerald-400" />
            <span>Quản Lý Cược & Ký Quỹ (Escrow Vaults)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Theo dõi trạng thái Program Account, số dư khóa ký quỹ 48h, và thực thi can thiệp trọng tài.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── Analytical Metrics Cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Collateral Locked */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Tổng Tiền Đang Khóa</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {metrics.totalLockedMoney.format()}
          </div>
          <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Bảo vệ an toàn trong Anchor Vault PDA
          </div>
        </div>

        {/* Card 2: 48h Countdown in Progress */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Đang Đếm Ngược 48h</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {metrics.deliveredCount} <span className="text-xs font-normal text-neutral-400">đơn</span>
          </div>
          <div className="text-[10px] text-neutral-400">Người mua đang kiểm định hàng</div>
        </div>

        {/* Card 3: Overdue Cranker Ready */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Quá Hạn Chờ Cranker</span>
            <Zap className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
            {metrics.expiredCrankerCount}{' '}
            <span className="text-xs font-normal text-neutral-400">đơn</span>
          </div>
          <div className="text-[10px] text-neutral-400">Đã đủ 48h, chờ giải ngân tự động</div>
        </div>

        {/* Card 4: Total Managed Escrows */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">Tổng Hợp Đồng Ký Quỹ</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {metrics.totalCount} <span className="text-xs font-normal text-neutral-400">hợp đồng</span>
          </div>
          <div className="text-[10px] text-blue-400/90 font-medium">100% On-Chain Escrow State</div>
        </div>
      </div>

      {/* ── Table Filter Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1 md:pb-0">
          {[
            ['ALL', 'Tất cả'],
            ['LOCKED', 'Khóa quỹ'],
            ['DELIVERED', 'Kiểm 48h'],
            ['COMPLETED', 'Hoàn tất'],
            ['DISPUTED', 'Khiếu nại'],
            ['REFUNDED', 'Hoàn tiền'],
          ].map(([statusKey, label]) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setSelectedStatus(statusKey)}
              className={clsx(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap',
                selectedStatus === statusKey
                  ? 'bg-neutral-100 text-neutral-900 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, ví, sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-neutral-800 bg-neutral-950 py-1.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ── Live High-Density Escrow Data Table ── */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center justify-between gap-4">
                <Skeleton className="h-8 w-40 bg-neutral-800 rounded-lg" />
                <Skeleton className="h-8 w-32 bg-neutral-800 rounded-lg" />
                <Skeleton className="h-8 w-24 bg-neutral-800 rounded-lg" />
                <Skeleton className="h-8 w-28 bg-neutral-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="Không tìm thấy hợp đồng ký quỹ nào"
              description={
                searchQuery
                  ? `Không có kết quả khớp với "${searchQuery}".`
                  : 'Hiện tại chưa có giao dịch ký quỹ nào trong trạng thái này.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="border-b border-neutral-800 bg-neutral-950 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3.5">Mã Đơn / Sản Phẩm</th>
                  <th className="px-4 py-3.5">Giá Trị Ký Quỹ</th>
                  <th className="px-4 py-3.5">Trạng Thái Vault</th>
                  <th className="px-4 py-3.5">Bộ Đếm 48 Giờ</th>
                  <th className="px-4 py-3.5">Ví Người Mua / Bán</th>
                  <th className="px-4 py-3.5 text-right">Hành Động Trọng Tài</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {filteredOrders.map(({ raw, entity }) => {
                  const statusInfo = STATUS_PILLS[raw.status] || {
                    label: raw.status,
                    badgeClass: 'bg-neutral-800 text-neutral-300',
                  };
                  const timer = entity.getTimer();
                  const isDelivered = raw.status === 'DELIVERED';
                  const isOperating = processingOrderId === raw.id;

                  return (
                    <tr key={raw.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Column 1: Order ID & Title */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-white tracking-wide">
                          #{raw.id.slice(0, 8)}...
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                          {raw.listingTitle || 'Giao dịch ký quỹ'}
                        </div>
                        <div className="text-[10px] text-neutral-500">{timeAgo(raw.createdAt)}</div>
                      </td>

                      {/* Column 2: Escrow Amount via Money */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-emerald-400">
                          {entity.amount.format()}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          ≈ {entity.amount.toSolEquivalent(5_000_000).format()}
                        </div>
                      </td>

                      {/* Column 3: Status Pill */}
                      <td className="px-4 py-3.5">
                        <span
                          className={clsx(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold',
                            statusInfo.badgeClass,
                          )}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Column 4: 48h Countdown via EscrowTimer */}
                      <td className="px-4 py-3.5">
                        {isDelivered && timer ? (
                          <div className="space-y-1">
                            <div
                              className={clsx(
                                'font-mono text-xs font-bold flex items-center gap-1',
                                timer.isExpired() ? 'text-rose-400' : 'text-amber-400',
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{timer.formatCountdown()}</span>
                            </div>
                            <div className="h-1.5 w-24 rounded-full bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${timer.getProgressPercentage()}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">--:--:--</span>
                        )}
                      </td>

                      {/* Column 5: Buyer & Seller Wallets */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div className="text-neutral-300">
                          <span className="text-neutral-500 mr-1">B:</span>
                          {raw.buyerWallet ? `${raw.buyerWallet.slice(0, 6)}...` : 'N/A'}
                        </div>
                        <div className="text-neutral-400">
                          <span className="text-neutral-500 mr-1">S:</span>
                          {raw.sellerWallet ? `${raw.sellerWallet.slice(0, 6)}...` : 'N/A'}
                        </div>
                      </td>

                      {/* Column 6: Emergency Ruling Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {raw.status === 'LOCKED' && (
                            <button
                              type="button"
                              onClick={() => handleEmergencyFreeze(raw.id)}
                              disabled={isOperating}
                              title="Hủy đơn và hoàn trả quỹ"
                              className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-rose-400 hover:bg-rose-950/80 hover:border-rose-700 transition"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {(raw.status === 'LOCKED' || raw.status === 'DELIVERED') && (
                            <button
                              type="button"
                              onClick={() => handleEmergencyRelease(raw.id)}
                              disabled={isOperating}
                              title="Giải ngân khẩn cấp cho người bán"
                              className="p-1.5 rounded-lg border border-emerald-800 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 transition"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <Link
                            href={`/admin/disputes`}
                            title="Chi tiết trọng tài"
                            className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

