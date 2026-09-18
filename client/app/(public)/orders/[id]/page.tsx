'use client';

import { use, useEffect, useState, useRef } from 'react';
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
  PackageCheck,
  FileCheck2,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import OrderStepper from '@/components/orders/OrderStepper';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { useOrderDetail, useConfirmOrder, useRaiseDispute } from '@/hooks/useMarketplace';
import { joinOrderRoom, leaveOrderRoom } from '@/libs/socket';
import { Skeleton } from '@/components/ui/skeleton';

function OrderDetailSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
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
  const [showInlineDispute, setShowInlineDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [disputePreviews, setDisputePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [countdownStr, setCountdownStr] = useState<string>('--:--:--');

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrderDetail(orderId);

  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmOrder();
  const { mutate: raiseDispute, isPending: isDisputing } = useRaiseDispute();

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
    return () => {
      disputePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [disputePreviews]);

  useEffect(() => {
    const socket = joinOrderRoom(orderId);
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    };
    socket.on('ORDER_STATUS_UPDATED', handler);
    socket.on('escrow:updated', handler);
    socket.on(`order_${orderId}`, handler);
    return () => {
      socket.off('ORDER_STATUS_UPDATED', handler);
      socket.off('escrow:updated', handler);
      socket.off(`order_${orderId}`, handler);
      leaveOrderRoom(orderId);
    };
  }, [orderId, queryClient]);

  const handleDisputeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    const allowed = picked.slice(0, 5 - disputeFiles.length);
    const previews = allowed.map((f) => URL.createObjectURL(f));
    setDisputeFiles((prev) => [...prev, ...allowed]);
    setDisputePreviews((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeDisputeFile = (idx: number) => {
    URL.revokeObjectURL(disputePreviews[idx]);
    setDisputeFiles((prev) => prev.filter((_, i) => i !== idx));
    setDisputePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInlineDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    const fd = new FormData();
    fd.append('reason', disputeReason.trim());
    disputeFiles.forEach((f) => fd.append('evidence', f));

    raiseDispute(
      { orderId, formData: fd },
      {
        onSuccess: () => {
          setDisputeReason('');
          setDisputeFiles([]);
          setDisputePreviews([]);
          setShowInlineDispute(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-full min-h-[70vh] py-10 px-4 sm:px-6">
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (isError || !order) {
    const msg = (error as any)?.response?.data?.message ?? (error as Error)?.message ?? 'Không tìm thấy đơn hàng';
    return (
      <div className="w-full max-w-full min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md mx-auto rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-xs text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">{msg}</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-6">Mã đơn hàng không hợp lệ hoặc đã bị xóa.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
            <Link
              href="/user/orders"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition active:scale-[0.98]"
            >
              Danh sách đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.amountVnd);

  return (
    <div className="w-full max-w-full pb-24 md:pb-12">
      <main className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-6">
        {/* Top navigation & action */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/user/orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Danh sách đơn hàng</span>
          </button>

          <Link
            href={`/chat?listingId=${order.listingId}&seller=${order.sellerWallet}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 shadow-2xs transition active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat với người bán</span>
          </Link>
        </div>

        {/* 4-Step Visual Stepper: Đã khóa quỹ -> Đã giao hàng -> Kiểm hàng (48h) -> Giải ngân */}
        <OrderStepper status={order.status} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="md:col-span-7 space-y-4">
            {/* Active Countdown Box for DELIVERED status */}
            {order.status === 'DELIVERED' && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-5 shadow-xs">
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
                  Bạn có <strong>48 giờ</strong> để kiểm tra kỹ sản phẩm. Nếu đúng mô tả, bấm <em>Xác nhận đã nhận đúng hàng</em> để giải ngân. Nếu có vấn đề, bạn có quyền khiếu nại trực tiếp trên trang này để Ban quản trị hỗ trợ.
                </p>
              </div>
            )}

            {/* Disputed banner */}
            {order.status === 'DISPUTED' && (
              <div className="rounded-3xl border border-rose-200 bg-white p-5 space-y-3 shadow-xs">
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
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-center space-y-1 shadow-xs">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Giao dịch hoàn tất!</h4>
                <p className="text-xs text-emerald-700">Tiền ký quỹ đã được giải ngân an toàn cho người bán.</p>
              </div>
            )}

            {/* On-Chain Receipt Panel: Monospace display of Vault PDA address, locked balance, and transaction status */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 text-neutral-100 p-6 shadow-xs space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-neutral-400 font-sans text-xs font-bold flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-emerald-400" />
                  Chứng nhận Ký quỹ On-Chain
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  SOLANA ANCHOR VAULT
                </span>
              </div>
              <div className="space-y-3 text-[11px] pt-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-neutral-400 font-sans">Vault PDA Address:</span>
                  <span className="text-emerald-400 font-mono font-bold truncate max-w-[200px] sm:max-w-xs">
                    {order.vaultPda || order.escrowAddress || '8xztF8k9VbWc1vNpQzM4vLk6d9K4j2LmAnchor'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-neutral-400 font-sans">Locked Balance:</span>
                  <span className="text-white font-mono font-bold">
                    {formattedAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-neutral-400 font-sans">Transaction Status:</span>
                  <span className="rounded-md bg-neutral-800 px-2.5 py-0.5 font-mono text-emerald-400 font-bold text-[10px]">
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-neutral-400 font-sans">Mã đơn hàng:</span>
                  <span className="text-neutral-300 font-mono">#{order.id}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-neutral-400 font-sans">Thời gian tạo:</span>
                  <span className="text-neutral-400 font-sans">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>

            {/* Inline Dispute Submission Form (revealed when user clicks Khiếu nại) */}
            {showInlineDispute && (
              <div className="rounded-3xl border border-rose-200 bg-white p-5 sm:p-6 shadow-md space-y-4 transition-all">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                    <h4 className="text-sm font-bold text-neutral-900">
                      Khiếu nại đơn hàng #{order.id}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInlineDispute(false)}
                    className="text-xs font-semibold text-neutral-400 hover:text-neutral-700"
                  >
                    Đóng
                  </button>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  Đơn hàng sẽ được chuyển sang chế độ <strong>Tranh chấp</strong>. Tiền ký quỹ được đóng băng an toàn cho đến khi Ban quản trị phân xử dựa trên bằng chứng của bạn.
                </p>

                <form onSubmit={handleInlineDisputeSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-700">
                      Lý do khiếu nại <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      minLength={10}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Mô tả cụ thể vấn đề: hàng không đúng mô tả, lỗi tính năng, vỡ hỏng..."
                      className="w-full rounded-xl border border-neutral-200 p-3 text-xs focus:border-rose-400 focus:outline-hidden focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-700">
                      Ảnh / video bằng chứng mở kiện (tối đa 5 file)
                    </label>

                    {disputeFiles.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-3 text-xs font-medium text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600"
                      >
                        <UploadCloud className="h-4 w-4" />
                        <span>Tải ảnh / video bằng chứng</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleDisputeFiles}
                    />

                    {disputePreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {disputePreviews.map((src, i) => (
                          <div
                            key={i}
                            className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`evidence-${i}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeDisputeFile(i)}
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineDispute(false)}
                      className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 active:scale-[0.98] transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isDisputing || !disputeReason.trim()}
                      className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isDisputing ? 'Đang gửi...' : 'Nộp khiếu nại'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 space-y-4">
            {/* Product Card */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs flex gap-4">
              {order.listingImage && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-100">
                  <Image src={order.listingImage} alt={order.listingTitle} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-neutral-900 line-clamp-2">{order.listingTitle}</h3>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-base font-extrabold text-emerald-600 font-sans">{formattedAmount}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Ký quỹ an toàn
                  </span>
                </div>
              </div>
            </div>

            {/* Dual Actions for DELIVERED status */}
            {order.status === 'DELIVERED' && (
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Thao tác người mua</h4>
                <button
                  type="button"
                  onClick={() => confirmOrder(order.id)}
                  disabled={isConfirming}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 py-3 text-xs font-bold text-white shadow-xs transition active:scale-[0.98] disabled:opacity-50"
                >
                  <PackageCheck className="h-4 w-4 text-emerald-400" />
                  <span>{isConfirming ? 'Đang giải ngân...' : 'Xác nhận đã nhận đúng hàng (Giải ngân)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInlineDispute((prev) => !prev)}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/70 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition active:scale-[0.98]"
                >
                  {showInlineDispute ? 'Thu gọn form khiếu nại' : 'Khiếu nại / Báo lỗi'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
