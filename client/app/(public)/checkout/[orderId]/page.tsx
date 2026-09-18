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
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Header from '@/components/common/Header';
import { Money } from '@/domain/value-objects/Money';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { usePaymentQr, useOrderDetail } from '@/hooks/useMarketplace';
import { joinOrderRoom, leaveOrderRoom } from '@/libs/socket';
import { QrSkeleton } from '@/components/checkout/QrSkeleton';
import type { Socket } from 'socket.io-client';

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Đã sao chép ${label.toLowerCase()}`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 border border-neutral-100">
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
  } = usePaymentQr(orderId);

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
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
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

  // WebSocket: Join order room
  useEffect(() => {
    const socket = joinOrderRoom(orderId);
    socketRef.current = socket;

    socket.on('PAYMENT_LOCKED', handlePaymentSuccess);
    socket.on('PAYMENT_CONFIRMED', handlePaymentSuccess);

    return () => {
      socket.off('PAYMENT_LOCKED', handlePaymentSuccess);
      socket.off('PAYMENT_CONFIRMED', handlePaymentSuccess);
      leaveOrderRoom(orderId);
    };
  }, [orderId, handlePaymentSuccess]);

  useEffect(() => {
    if (qrError && qrErrorObj) {
      const msg =
        (qrErrorObj as any)?.response?.data?.message ??
        (qrErrorObj as Error)?.message ??
        'Không thể tải thông tin thanh toán';
      toast.error(msg);
    }
  }, [qrError, qrErrorObj]);

  if (isPaid) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Sparkles className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">Thanh toán Ký Quỹ thành công!</h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-500">
            Tiền ký quỹ đã được khoá an toàn trong Solana Vault. Đang chuyển hướng đến đơn hàng...
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Bảo vệ ký quỹ 48h đã kích hoạt
        </div>
      </div>
    );
  }

  const amountNumber = qrData?.amount ?? order?.amountVnd ?? 0;
  const money = new Money(amountNumber, 'VND');

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      {/* Top Header Card */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
          <QrCode className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-neutral-950">
            Thanh toán Ký Quỹ VietQR
          </h1>
          <p className="text-xs text-neutral-500">
            Khóa tiền an toàn trong Solana Vault
          </p>
        </div>
      </div>

      {/* Countdown Ticker */}
      <div className="flex items-center justify-between rounded-2xl bg-amber-50/80 px-4 py-3 border border-amber-200/60">
        <div className="flex items-center gap-2 text-amber-800">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-bold">Thời gian thanh toán còn lại</span>
        </div>
        <span className={`font-mono text-sm font-extrabold ${isExpired ? 'text-rose-600' : 'text-amber-800'}`}>
          {countdownStr}
        </span>
      </div>

      {/* Amount Display */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Số tiền cần chuyển</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
          {money.format()}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Chuyển đúng số tiền và nội dung để kích hoạt ký quỹ
        </p>
      </div>

      {/* Dynamic QR Canvas */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Quét mã VietQR</h2>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
            <ShieldCheck className="h-3 w-3" />
            Ký quỹ bảo vệ
          </span>
        </div>

        {qrLoading && (
          <div className="flex flex-col items-center">
            <QrSkeleton />
          </div>
        )}

        {qrError && !qrLoading && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div>
              <p className="font-bold text-neutral-800 text-sm">Không thể tải mã QR</p>
              <p className="mt-1 text-xs text-neutral-500">
                {(qrErrorObj as any)?.response?.data?.message ?? 'Vui lòng thử lại'}
              </p>
            </div>
            <button
              onClick={() => refetchQr()}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800"
            >
              <RefreshCw className="h-4 w-4" /> Tải lại
            </button>
          </div>
        )}

        {qrData && !qrLoading && !qrError && (
          <div className="flex flex-col items-center gap-5">
            <div className="relative h-52 w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xs">
              <Image
                src={qrData.qrCodeUrl}
                alt="VietQR payment code"
                fill
                className="object-contain p-2"
                priority
              />
            </div>

            {/* Breakdown Table */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 border border-neutral-100">
                <span className="text-xs font-medium text-neutral-500">Sản phẩm</span>
                <span className="truncate max-w-[65%] text-xs font-bold text-neutral-800">
                  {order?.listingTitle || 'Đơn hàng ký quỹ'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 border border-neutral-100">
                <span className="text-xs font-medium text-neutral-500">Người thụ hưởng</span>
                <span className="font-mono text-xs font-bold text-neutral-900 uppercase">
                  CHỢ KÝ QUỸ ESCROW VAULT
                </span>
              </div>

              {qrData.bankName && (
                <CopyRow label="Ngân hàng" value={qrData.bankName} />
              )}
              <CopyRow label="Số tài khoản" value={qrData.accountNo} />
              <CopyRow label="Số tiền" value={money.format()} />
              <CopyRow label="Nội dung chuyển khoản" value={qrData.memo} />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/orders/${orderId}`)}
        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 shadow-2xs"
      >
        Tôi đã chuyển khoản → Xem đơn hàng
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
    <div className="min-h-screen bg-[#fafafa]">
      <Header title="Thanh toán Ký Quỹ" showLocation={false} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-10">
            <QrSkeleton />
          </div>
        }
      >
        <CheckoutContent params={params} />
      </Suspense>
    </div>
  );
}
