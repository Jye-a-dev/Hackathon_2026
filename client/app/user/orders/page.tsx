'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Package,
  Truck,
  RotateCcw,
  X,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { Money } from '@/domain/value-objects/Money';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { EscrowOrder, EscrowStatus } from '@/domain/entities/EscrowOrder';
import {
  useMyOrders,
  useConfirmOrder,
  useRaiseDispute,
  useCurrentUser,
} from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { timeAgo } from '@/utils/formatTime';
import type { Order } from '@/types/order';

// 4-Step Escrow Stepper Definition
const ESCROW_STEPS = [
  { id: 'LOCKED', label: 'Đã khóa quỹ', icon: ShieldCheck },
  { id: 'SHIPPED', label: 'Đã giao hàng', icon: Truck },
  { id: 'DELIVERED', label: 'Kiểm hàng 48h', icon: Clock },
  { id: 'COMPLETED', label: 'Giải ngân', icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 0;
    case 'LOCKED':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 3;
    case 'COMPLETED':
      return 4;
    case 'DISPUTED':
      return 3;
    case 'REFUNDED':
    case 'CANCELLED':
      return 1;
    default:
      return 1;
  }
}

export default function UserOrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [disputeModalOrderId, setDisputeModalOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Current authenticated user
  const { data: user } = useCurrentUser();
  const buyerWallet = user?.id; // Can match buyer id or wallet

  // Real TanStack Query: Fetch user orders
  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMyOrders({
    buyerWallet: buyerWallet || undefined,
  });

  const confirmMutation = useConfirmOrder();
  const disputeMutation = useRaiseDispute();

  // Convert raw API records to OOP domain entities
  const domainOrders = useMemo(() => {
    return orders.map((o: Order) => ({
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
    }));
  }, [orders]);

  // Tab filtering logic
  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return domainOrders;
    if (activeTab === 'LOCKED') {
      return domainOrders.filter(({ raw }) => raw.status === 'LOCKED');
    }
    if (activeTab === 'IN_PROGRESS') {
      return domainOrders.filter(({ raw }) =>
        ['SHIPPED', 'DELIVERED'].includes(raw.status),
      );
    }
    if (activeTab === 'COMPLETED') {
      return domainOrders.filter(({ raw }) => raw.status === 'COMPLETED');
    }
    if (activeTab === 'DISPUTED') {
      return domainOrders.filter(({ raw }) =>
        ['DISPUTED', 'REFUNDED'].includes(raw.status),
      );
    }
    return domainOrders;
  }, [domainOrders, activeTab]);

  const handleConfirmReceipt = async (orderId: string) => {
    if (
      !confirm(
        'Bạn đã nhận hàng và hài lòng 100%? Khi bấm xác nhận, tiền ký quỹ sẽ được giải ngân ngay lập tức cho người bán.',
      )
    ) {
      return;
    }
    try {
      await confirmMutation.mutateAsync(orderId);
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalOrderId || !disputeReason.trim()) {
      toast.error('Vui lòng nhập lý do khiếu nại chi tiết.');
      return;
    }

    setIsSubmittingDispute(true);
    const formData = new FormData();
    formData.append('reason', disputeReason.trim());
    evidenceFiles.forEach((file) => {
      formData.append('evidence', file);
    });

    try {
      await disputeMutation.mutateAsync({
        orderId: disputeModalOrderId,
        formData,
      });
      setDisputeModalOrderId(null);
      setDisputeReason('');
      setEvidenceFiles([]);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Title & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-6 w-6 text-neutral-900" />
            <span>Đơn Mua & Bảo Vệ Ký Quỹ</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Toàn bộ tiền mua sắm được giữ an toàn tại Vault 48h. Bạn chỉ thanh toán khi đã kiểm hàng chuẩn xác.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 shadow-2xs"
        >
          <RotateCcw className={clsx('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* ── Tabs Filter Toolbar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1 border-b border-neutral-200">
        {[
          ['ALL', 'Tất cả đơn hàng'],
          ['LOCKED', 'Đang khóa quỹ'],
          ['IN_PROGRESS', 'Đang giao & Kiểm 48h'],
          ['COMPLETED', 'Đã hoàn tất'],
          ['DISPUTED', 'Khiếu nại / Hoàn tiền'],
        ].map(([tabKey, label]) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setActiveTab(tabKey)}
            className={clsx(
              'rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap',
              activeTab === tabKey
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Order List ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
              <Skeleton className="h-6 w-1/3 rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/4 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-2xs">
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Bạn hiện không có đơn hàng ký quỹ nào trong danh mục này. Hãy khám phá và mua sắm an toàn trên TrustPass!"
            action={{ label: 'Khám phá sản phẩm ngay', href: '/' }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(({ raw, entity }) => {
            const timer = entity.getTimer();
            const currentStepIdx = getStepIndex(raw.status);
            const isDelivered = raw.status === 'DELIVERED';
            const isDisputed = raw.status === 'DISPUTED';

            return (
              <div
                key={raw.id}
                className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs space-y-5 transition hover:border-neutral-300"
              >
                {/* Header: Order ID, Created date, Status badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-900">
                      Mã đơn #{raw.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      • {timeAgo(raw.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {raw.status === 'LOCKED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" />
                        Đã Khóa Quỹ Vault
                      </span>
                    )}
                    {raw.status === 'DELIVERED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                        <Clock className="h-3 w-3" />
                        Đang Kiểm Hàng 48h
                      </span>
                    )}
                    {raw.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Đã Hoàn Tất
                      </span>
                    )}
                    {raw.status === 'DISPUTED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200">
                        <AlertTriangle className="h-3 w-3" />
                        Đang Khiếu Nại Trọng Tài
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Product Info & Price */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200">
                      {raw.listingImage ? (
                        <Image
                          src={raw.listingImage}
                          alt={raw.listingTitle || 'Sản phẩm'}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/listings/${raw.listingId}`}
                        className="truncate text-sm font-bold text-neutral-900 hover:text-emerald-700 transition flex items-center gap-1 group"
                      >
                        <span className="truncate">{raw.listingTitle || 'Giao dịch ký quỹ'}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition" />
                      </Link>
                      <div className="text-xs text-neutral-500 font-mono">
                        Ví người bán: {raw.sellerWallet ? `${raw.sellerWallet.slice(0, 10)}...` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-neutral-950 font-mono">
                      {entity.amount.format()}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      ≈ {entity.amount.toSolEquivalent(5_000_000).format()}
                    </div>
                  </div>
                </div>

                {/* 4-Step Escrow Stepper */}
                <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                  <div className="grid grid-cols-4 gap-2">
                    {ESCROW_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isCompletedStep = idx < currentStepIdx;
                      const isCurrentStep = idx === currentStepIdx - 1;

                      return (
                        <div key={step.id} className="flex flex-col items-center text-center">
                          <div
                            className={clsx(
                              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all mb-1',
                              isCompletedStep
                                ? 'bg-emerald-600 text-white'
                                : isCurrentStep
                                ? 'bg-neutral-900 text-white ring-2 ring-emerald-400'
                                : 'bg-neutral-200 text-neutral-500',
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span
                            className={clsx(
                              'text-[10px] font-semibold truncate w-full',
                              isCurrentStep ? 'text-neutral-950 font-bold' : 'text-neutral-400',
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 48h Live Ticking Countdown (if DELIVERED) */}
                {isDelivered && timer && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
                        <span>Thời Gian Kiểm Hàng An Toàn Còn Lại</span>
                      </div>
                      <p className="text-[11px] text-amber-700">
                        Nếu sau thời gian này bạn không khiếu nại, tiền ký quỹ sẽ tự động giải ngân cho người bán.
                      </p>
                    </div>

                    <div className="font-mono text-lg font-black text-amber-900 px-3 py-1 bg-white rounded-lg border border-amber-200 shadow-2xs">
                      {timer.formatCountdown()}
                    </div>
                  </div>
                )}

                {/* Footer Action Triggers */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                  <div className="text-xs text-neutral-500">
                    Hợp đồng được bảo chứng bởi TrustPass Solana Escrow.
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Can open dispute if DELIVERED or within window */}
                    {entity.canRaiseDispute() && (
                      <button
                        type="button"
                        onClick={() => setDisputeModalOrderId(raw.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Khiếu nại (Dispute)
                      </button>
                    )}

                    {/* Confirm receipt */}
                    {entity.canConfirmReceipt() && (
                      <button
                        type="button"
                        onClick={() => handleConfirmReceipt(raw.id)}
                        disabled={confirmMutation.isPending}
                        className="rounded-xl bg-neutral-900 hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-white transition active:scale-95 shadow-2xs"
                      >
                        {confirmMutation.isPending ? 'Đang xử lý...' : 'Xác nhận nhận đúng hàng'}
                      </button>
                    )}

                    {raw.status === 'LOCKED' && (
                      <span className="text-xs font-semibold text-emerald-700">
                        Chờ người bán đóng gói và gửi hàng
                      </span>
                    )}

                    {isDisputed && (
                      <Link
                        href="/chat"
                        className="rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        Nhắn tin thương lượng
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dispute Submission Modal ── */}
      {disputeModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Mở Phiếu Khiếu Nại Đơn Hàng</span>
              </h3>
              <button
                type="button"
                onClick={() => setDisputeModalOrderId(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Mô tả vấn đề chi tiết (hàng lỗi, sai mẫu, rách vỡ...) *
                </label>
                <textarea
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Mô tả cụ thể sự cố để trọng tài viên đối soát với người bán..."
                  required
                  className="w-full rounded-xl border border-neutral-200 p-3 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tải lên ảnh / video mở hộp (Evidence)
                </label>
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 p-4 hover:bg-neutral-50 cursor-pointer transition">
                  <UploadCloud className="h-6 w-6 text-neutral-400 mb-1" />
                  <span className="text-xs font-semibold text-neutral-700">Chọn tệp bằng chứng</span>
                  <span className="text-[10px] text-neutral-400">Hỗ trợ JPG, PNG, MP4</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setEvidenceFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>

                {evidenceFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {evidenceFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-neutral-600">
                        <FileText className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-[10px] text-neutral-400">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setDisputeModalOrderId(null)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition active:scale-95 shadow-2xs"
                >
                  {isSubmittingDispute ? 'Đang gửi...' : 'Gửi khiếu nại lên Trọng tài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

