'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import OrderStepper from '@/components/orders/OrderStepper';
import DisputeModal from '@/components/orders/DisputeModal';
import Header from '@/components/common/Header';
import { Money } from '@/domain/value-objects/Money';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { useOrderDetail, useConfirmOrder } from '@/hooks/useMarketplace';
import { joinOrderRoom, leaveOrderRoom } from '@/libs/socket';
import { Skeleton } from '@/components/ui/skeleton';

function OrderDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [countdownStr, setCountdownStr] = useState<string>('--:--:--');

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrderDetail(orderId);

  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmOrder();

  // EscrowTimer countdown for 48h
  useEffect(() => {
    if (!order?.deliveredAt || order.status !== 'DELIVERED') return;
    const deliveredDate = new Date(order.deliveredAt);
    const targetDate = new Date(deliveredDate.getTime() + 172800 * 1000);
    const timer = new EscrowTimer(targetDate);

    const update = () => {
      setCountdownStr(timer.formatCountdown());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order?.deliveredAt, order?.status]);

  useEffect(() => {
    if (isError && error) {
      const msg = (error as any)?.response?.data?.message ?? (error as Error)?.message ?? 'Lỗi khi tải đơn hàng';
      toast.error(msg);
    }
  }, [isError, error]);

  useEffect(() => {
    const socket = joinOrderRoom(orderId);
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    };
    socket.on('ORDER_STATUS_UPDATED', handler);
    return () => {
      socket.off('ORDER_STATUS_UPDATED', handler);
      leaveOrderRoom(orderId);
    };
  }, [orderId, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Header showLocation={false} />
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (isError || !order) {
    const msg = (error as any)?.response?.data?.message ?? (error as Error)?.message ?? 'Không tìm thấy đơn hàng';
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Header showLocation={false} />
        <div className="max-w-md mx-auto my-16 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-base font-bold text-neutral-800">{msg}</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-6">Mã đơn hàng không hợp lệ hoặc đã bị xóa.</p>
          <button
            onClick={() => refetch()}
            className="mr-3 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Thử lại
          </button>
          <Link
            href="/orders"
            className="inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white"
          >
            Danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const moneyVnd = new Money(order.amountVnd, 'VND');
  const moneySol = moneyVnd.amount > 0 ? moneyVnd.toSolEquivalent(3500000) : new Money(0, 'SOL');
  const vaultPda = `Vault48h_${order.id.slice(0, 8)}...${order.id.slice(-6)}`;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-28 md:pb-12">
      <Header showLocation={false} title={`Đơn hàng #${order.id.slice(-6)}`} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Top breadcrumb & chat */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Danh sách đơn hàng
          </button>

          <Link
            href={`/chat?listingId=${order.listingId}&seller=${order.sellerWallet}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
          >
            <MessageCircle className="h-4 w-4" />
            Chat với đối tác
          </Link>
        </div>

        {/* 4-Step Stepper */}
        <OrderStepper status={order.status} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="md:col-span-7 space-y-4">
            {/* 48h Countdown Callout */}
            {order.status === 'DELIVERED' && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">Thời gian kiểm hàng còn lại:</span>
                  </div>
                  <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-xl border border-amber-200 bg-white text-amber-800 shadow-2xs">
                    {countdownStr}
                  </span>
                </div>
                <p className="mt-2 text-xs text-amber-800 leading-relaxed">
                  Bạn có <strong>48 giờ</strong> để kiểm tra kỹ sản phẩm. Nếu đúng mô tả, bấm <em>Đã nhận đúng hàng</em> để giải ngân. Nếu có vấn đề, bạn có quyền khiếu nại.
                </p>
              </div>
            )}

            {/* Disputed banner */}
            {order.status === 'DISPUTED' && (
              <div className="rounded-2xl border border-rose-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="text-sm font-bold">Đang chờ Trọng tài phân xử</h4>
                </div>
                <p className="text-xs text-neutral-700 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
                  &ldquo;{order.disputeReason || 'Sản phẩm phát sinh lỗi hoặc không đúng mô tả.'}&rdquo;
                </p>
                <Link href="/admin/disputes" className="block text-center text-xs font-bold text-neutral-900 hover:underline pt-1">
                  Mở Cổng Trọng Tài để kiểm tra tiến trình →
                </Link>
              </div>
            )}

            {/* Completed banner */}
            {order.status === 'COMPLETED' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-1 shadow-xs">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Giao dịch hoàn tất!</h4>
                <p className="text-xs text-emerald-700">Tiền ký quỹ đã được giải ngân an toàn cho người bán.</p>
              </div>
            )}

            {/* On-chain Receipt Box */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-100 p-5 shadow-sm space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-sans text-xs font-bold">Chứng nhận Hợp đồng Ký quỹ</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  LOCKED_IN_ESCROW
                </span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Mã đơn hàng:</span>
                  <span className="text-white">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Vault PDA:</span>
                  <span className="text-emerald-400">{vaultPda}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Ký quỹ VNĐ:</span>
                  <span className="text-white">{moneyVnd.format()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Tương đương SOL:</span>
                  <span className="text-neutral-300">{moneySol.format()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Thời gian tạo:</span>
                  <span className="text-neutral-300">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 space-y-4">
            {/* Product Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex gap-4">
              {order.listingImage && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                  <Image src={order.listingImage} alt={order.listingTitle} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-neutral-900 line-clamp-2">{order.listingTitle}</h3>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-base font-extrabold text-emerald-600 font-sans">{moneyVnd.format()}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Ký quỹ an toàn
                  </span>
                </div>
              </div>
            </div>

            {/* Dual Actions for DELIVERED status */}
            {order.status === 'DELIVERED' && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Thao tác người mua</h4>
                <button
                  type="button"
                  onClick={() => confirmOrder(order.id)}
                  disabled={isConfirming}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isConfirming ? 'Đang giải ngân...' : 'Đã nhận đúng hàng (Giải ngân)'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisputeOpen(true)}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/70 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                >
                  Khiếu nại / Báo lỗi
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dispute modal */}
      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        orderId={order.id}
      />
    </div>
  );
}
