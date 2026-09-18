'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Money } from '@/domain/value-objects/Money';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { usePaymentQr, useOrderDetail } from '@/hooks/useMarketplace';
import { joinOrderRoom, leaveOrderRoom } from '@/libs/socket';
import { QrSkeleton } from '@/components/checkout/QrSkeleton';
import type { Socket } from 'socket.io-client';

interface CheckoutModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  listingTitle?: string;
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
    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-neutral-100">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <div className="flex items-center gap-2 max-w-[60%]">
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

export default function CheckoutModal({
  orderId,
  isOpen,
  onClose,
  listingTitle,
}: CheckoutModalProps) {
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

  // EscrowTimer object for countdown
  const [countdownStr, setCountdownStr] = useState<string>('--:--');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!qrData?.expiresAt) return;
    const timer = new EscrowTimer(new Date(qrData.expiresAt));

    const updateTimer = () => {
      const remainingSec = timer.getRemainingSeconds();
      setCountdownStr(timer.formatCountdown());
      if (remainingSec <= 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrData?.expiresAt]);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b'],
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
    setTimeout(() => {
      onClose();
      router.push(`/orders/${orderId}`);
    }, 2500);
  }, [orderId, router, triggerCelebration, onClose]);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const socket = joinOrderRoom(orderId);
    socketRef.current = socket;

    socket.on('PAYMENT_LOCKED', handlePaymentSuccess);
    socket.on('PAYMENT_CONFIRMED', handlePaymentSuccess);

    return () => {
      socket.off('PAYMENT_LOCKED', handlePaymentSuccess);
      socket.off('PAYMENT_CONFIRMED', handlePaymentSuccess);
      leaveOrderRoom(orderId);
    };
  }, [isOpen, orderId, handlePaymentSuccess]);

  useEffect(() => {
    if (qrError && qrErrorObj) {
      const msg =
        (qrErrorObj as any)?.response?.data?.message ??
        (qrErrorObj as Error)?.message ??
        'Không thể tải thông tin thanh toán VietQR';
      toast.error(msg);
    }
  }, [qrError, qrErrorObj]);

  if (!isOpen) return null;

  const displayTitle = listingTitle || order?.listingTitle || 'Đơn hàng ký quỹ';
  const amountVnd = qrData?.amount ?? order?.amountVnd ?? 0;
  const money = new Money(amountVnd, 'VND');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        {isPaid ? (
          <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-neutral-900">Thanh toán Ký Quỹ thành công!</h3>
              <p className="mt-1.5 text-xs text-neutral-500">
                Tiền đã được khóa trong Hợp đồng Ký quỹ Solana Vault. Đang chuyển hướng...
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Bảo vệ ký quỹ 48h đã kích hoạt
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-950">
                  Thanh toán Ký Quỹ VietQR
                </h3>
                <p className="text-xs text-neutral-500">
                  Khóa tiền an toàn trong Solana Vault
                </p>
              </div>
            </div>

            {/* Countdown Ticker */}
            <div className="flex items-center justify-between rounded-xl bg-amber-50/80 px-3.5 py-2 border border-amber-200/60">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" />
                <span>Thời gian thanh toán còn lại</span>
              </div>
              <span className={`font-mono text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-amber-800'}`}>
                {countdownStr}
              </span>
            </div>

            {/* Dynamic QR Canvas */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4">
              {qrLoading && <QrSkeleton />}

              {qrError && !qrLoading && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                  <p className="text-xs font-semibold text-neutral-800">Không thể tạo mã VietQR</p>
                  <button
                    onClick={() => refetchQr()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-neutral-800"
                  >
                    <RefreshCw className="h-3 w-3" /> Thử lại
                  </button>
                </div>
              )}

              {qrData && !qrLoading && !qrError && (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-52 w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
                    <Image
                      src={qrData.qrCodeUrl}
                      alt="VietQR Escrow Transfer"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-400">
                    Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã
                  </p>
                </div>
              )}
            </div>

            {/* Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-neutral-100">
                <span className="text-xs font-medium text-neutral-500">Sản phẩm</span>
                <span className="truncate max-w-[60%] text-xs font-bold text-neutral-800">{displayTitle}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-neutral-100">
                <span className="text-xs font-medium text-neutral-500">Số tiền (VNĐ)</span>
                <span className="font-mono text-sm font-extrabold text-emerald-600">{money.format()}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-neutral-100">
                <span className="text-xs font-medium text-neutral-500">Người thụ hưởng</span>
                <span className="font-mono text-xs font-bold text-neutral-800 uppercase">
                  CHỢ KÝ QUỸ ESCROW VAULT
                </span>
              </div>

              {qrData?.accountNo && (
                <CopyRow label="Số tài khoản" value={qrData.accountNo} />
              )}

              {qrData?.memo && (
                <CopyRow label="Nội dung chuyển khoản" value={qrData.memo} />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/orders/${orderId}`);
                }}
                className="w-full rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white transition hover:bg-neutral-800 active:scale-95 shadow-md"
              >
                Tôi đã chuyển khoản → Xem đơn hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

