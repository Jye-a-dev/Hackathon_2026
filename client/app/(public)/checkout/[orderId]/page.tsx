'use client';

import { use, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { usePaymentQr, useOrderDetail } from '@/hooks/useMarketplace';
import { joinOrderRoom, leaveOrderRoom } from '@/libs/socket';
import { QrSkeleton } from '@/components/checkout/QrSkeleton';
import type { Socket } from 'socket.io-client';

interface OrderSocketPayload {
  orderId?: string;
  order_id?: string;
  status?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Đã sao chép ${label.toLowerCase()}`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 border border-neutral-200/60">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <div className="flex items-center gap-2 max-w-[65%]">
        <span className="truncate font-mono text-xs font-bold text-neutral-900">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="text-neutral-400 hover:text-neutral-700 transition"
          aria-label={`Sao chép ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function CheckoutContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [isPaid, setIsPaid] = useState(false);
  const isFinishedRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  const { data: order } = useOrderDetail(orderId);
  const {
    data: qrData,
    isLoading: qrLoading,
    isError: qrError,
    error: qrErrorObj,
    refetch: refetchQr,
  } = usePaymentQr(orderId, order?.amountVnd);

  // Derive countdown via domain EscrowTimer
  const [countdownStr, setCountdownStr] = useState<string>('--:--');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!qrData?.expiresAt) return;
    const timer = new EscrowTimer(new Date(qrData.expiresAt));

    const update = () => {
      setCountdownStr(timer.formatCountdown());
      if (timer.isExpired()) {
        setIsExpired(true);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [qrData?.expiresAt]);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#0f172a', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // cosmetic
    }
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsPaid(true);
    triggerCelebration();
    toast.success('Thanh toán thành công! Tiền ký quỹ đã được khoá an toàn.');
    setTimeout(() => router.push(`/orders/${orderId}`), 2500);
  }, [orderId, router, triggerCelebration]);

  // WebSocket: Join order room and listen for real-time escrow lock
  useEffect(() => {
    const socket = joinOrderRoom(orderId);
    socketRef.current = socket;

    const handleEscrowUpdate = (event: OrderSocketPayload) => {
      if (
        (event?.orderId === orderId || event?.order_id === orderId) &&
        (event?.status === 'LOCKED' || event?.status === 'DELIVERING' || event?.status === 'CONFIRMED')
      ) {
        handlePaymentSuccess();
      }
    };

    socket.on('escrow:updated', handleEscrowUpdate);
    socket.on('PAYMENT_LOCKED', handlePaymentSuccess);
    socket.on('PAYMENT_CONFIRMED', handlePaymentSuccess);
    socket.on(`order_${orderId}`, (event: OrderSocketPayload | string) => {
      const eventStatus = typeof event === 'string' ? event : event?.status;
      if (eventStatus === 'LOCKED' || eventStatus === 'CONFIRMED' || event === 'PAYMENT_LOCKED') {
        handlePaymentSuccess();
      }
    });

    return () => {
      socket.off('escrow:updated', handleEscrowUpdate);
      socket.off('PAYMENT_LOCKED', handlePaymentSuccess);
      socket.off('PAYMENT_CONFIRMED', handlePaymentSuccess);
      socket.off(`order_${orderId}`);
      leaveOrderRoom(orderId);
    };
  }, [orderId, handlePaymentSuccess]);

  useEffect(() => {
    if (qrError && qrErrorObj) {
      const msg =
        (qrErrorObj as ApiErrorResponse)?.response?.data?.message ??
        (qrErrorObj as Error)?.message ??
        'Không thể tải thông tin thanh toán';
      toast.error(msg);
    }
  }, [qrError, qrErrorObj]);

  if (isPaid) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <Sparkles className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">Thanh toán Ký Quỹ thành công!</h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-500">
            Tiền ký quỹ đã được khoá an toàn trong Hệ thống Ký quỹ. Đang chuyển hướng đến đơn hàng...
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 border border-emerald-200/70">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Bảo vệ ký quỹ 48h đã kích hoạt
        </div>
      </div>
    );
  }

  const amountNumber = qrData?.amount ?? order?.amountVnd ?? 0;
  const formattedVnd = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amountNumber);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/80 shadow-xl p-5 sm:p-8 space-y-5 sm:space-y-6">
      {/* Top Header Card */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-emerald-400">
          <QrCode className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-neutral-950 truncate">
              Ký Quỹ VietQR
            </h1>
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              48h
            </span>
          </div>
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {order?.listingTitle || 'Khóa tiền an toàn với Hợp đồng Ký quỹ 48h'}
          </p>
        </div>
      </div>

      {/* Ticking Amber Timer Pill */}
      <div className="flex items-center justify-between rounded-2xl bg-amber-50/80 px-3.5 py-2.5 border border-amber-200/60">
        <div className="flex items-center gap-1.5 text-amber-800">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-bold">Thời gian thanh toán còn lại</span>
        </div>
        <span className={`font-mono text-sm font-extrabold ${isExpired ? 'text-rose-600' : 'text-amber-800'}`}>
          {countdownStr}
        </span>
      </div>

      {/* Amount Display */}
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Số tiền cần chuyển</p>
        <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 font-sans">
          {formattedVnd}
        </p>
        <p className="mt-1 text-[11px] text-neutral-500">
          Chuyển đúng số tiền và nội dung để hệ thống tự động kích hoạt ký quỹ
        </p>
      </div>

      {/* Dynamic VietQR Canvas: w-48 h-48 sm:w-56 sm:h-56 */}
      <div className="flex flex-col items-center gap-4">
        {qrLoading && (
          <div className="flex flex-col items-center">
            <QrSkeleton />
          </div>
        )}

        {qrError && !qrLoading && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="h-9 w-9 text-rose-500" />
            <div>
              <p className="font-bold text-neutral-800 text-sm">Không thể tải mã QR</p>
              <p className="mt-1 text-xs text-neutral-500">
                {(qrErrorObj as ApiErrorResponse)?.response?.data?.message ?? 'Vui lòng thử lại'}
              </p>
            </div>
            <button
              onClick={() => refetchQr()}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Tải lại
            </button>
          </div>
        )}

        {qrData && !qrLoading && !qrError && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-2xl border border-neutral-200/80 p-2.5 bg-white shadow-inner flex items-center justify-center relative overflow-hidden">
              {qrData.qrCodeUrl && (
                <Image
                  src={qrData.qrCodeUrl}
                  alt="VietQR payment code"
                  fill
                  className="object-contain p-2"
                  priority
                  unoptimized
                />
              )}
            </div>

            {/* Detailed Transfer Breakdown Card */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-neutral-200/60">
                <span className="text-xs font-medium text-neutral-500">Người nhận</span>
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase truncate max-w-[60%]">
                  {qrData.accountHolderName || 'HỆ THỐNG KÝ QUỸ TRUSTPASS'}
                </span>
              </div>

              {qrData.bankName && (
                <CopyRow label="Ngân hàng" value={qrData.bankName} />
              )}
              <CopyRow label="Số tài khoản" value={qrData.accountNo} />
              <CopyRow label="Số tiền" value={formattedVnd} />
              <CopyRow label="Nội dung" value={qrData.memo} />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/orders/${orderId}`)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-4 h-12 text-xs font-bold transition shadow-xs active:scale-[0.98] duration-100"
      >
        <span>Tôi đã chuyển khoản → Xem đơn hàng</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto">
            <QrSkeleton />
          </div>
        }
      >
        <CheckoutContent params={params} />
      </Suspense>
    </div>
  );
}
