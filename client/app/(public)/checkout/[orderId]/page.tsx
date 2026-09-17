'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  ChevronLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import Header from '@/components/common/Header';
import { formatVND } from '@/utils/formatCurrency';
import { formatCountdown } from '@/utils/formatTime';
import { ordersApi } from '@/libs/api';
import { getEscrowSocket } from '@/libs/socket';
import type { Order } from '@/types/order';

import { Suspense } from 'react';

function CheckoutContent({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdownSec, setCountdownSec] = useState(15 * 60);

  const bankInfo = {
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    bankCode: 'MB',
    accountNumber: '999988887777',
    accountName: 'CONG TY KY QUY P2P AN TOAN',
    transferContent: `KQ ${resolvedParams.orderId.slice(-6).toUpperCase()}`,
  };

  const amountVnd =
    order?.amountVnd ?? Number(searchParams.get('amount') ?? 2450000);

  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-compact2.png?amount=${amountVnd}&addInfo=${encodeURIComponent(
    bankInfo.transferContent,
  )}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishedRef = useRef(false);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // fallback
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    if (pollingRef.current) clearInterval(pollingRef.current);

    setIsPaid(true);
    triggerCelebration();
  }, []);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await ordersApi.get(resolvedParams.orderId);
        if (data && data.id) {
          setOrder(data);
          if (
            data.status === 'LOCKED' ||
            data.status === 'COMPLETED' ||
            data.status === 'DELIVERED'
          ) {
            handlePaymentSuccess();
          }
        } else {
          setErrorMsg('Không tìm thấy hợp đồng giao dịch');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [resolvedParams.orderId, handlePaymentSuccess]);

  // Socket.io + Polling Fallback
  useEffect(() => {
    if (isPaid || isFinishedRef.current) return;

    let socket: Socket | null = null;
    try {
      socket = getEscrowSocket();
      socket.connect();
      socket.emit('subscribe_order', { orderId: resolvedParams.orderId });

      socket.on('order_paid', (payload: { orderId?: string }) => {
        if (payload?.orderId === resolvedParams.orderId) {
          handlePaymentSuccess();
        }
      });
    } catch {
      // Socket fallback
    }

    pollingRef.current = setInterval(async () => {
      if (isFinishedRef.current) return;
      try {
        const checked = await ordersApi.get(resolvedParams.orderId);
        if (
          checked?.status === 'LOCKED' ||
          checked?.status === 'COMPLETED' ||
          checked?.status === 'DELIVERED'
        ) {
          handlePaymentSuccess();
        }
      } catch {
        // Retry silently
      }
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (socket) {
        socket.off('order_paid');
        socket.disconnect();
      }
    };
  }, [isPaid, resolvedParams.orderId, handlePaymentSuccess]);

  // Countdown timer
  useEffect(() => {
    if (isPaid) return;
    const timer = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showLocation={false} />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="skeleton h-8 w-40 rounded-xl" />
          <div className="skeleton h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showLocation={false} />
        <div className="max-w-md mx-auto my-16 bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-bold text-slate-800">{errorMsg}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Không tìm thấy thông tin đơn hàng để thanh toán.
          </p>
          <Link
            href="/"
            className="gradient-primary rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200"
          >
            Quay lại Khám phá
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header showLocation={false} title="Thanh toán Ký quỹ" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {isPaid ? (
          /* Payment Success State */
          <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm text-center space-y-4 animate-bounce-in">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Đã nhận thanh toán Ký quỹ!
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hợp đồng ký quỹ Solana đã kích hoạt thành công. Tiền của bạn đang được khóa an toàn và người bán đã nhận được thông báo để gửi hàng.
            </p>

            <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-800">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-emerald-900">
                  #{resolvedParams.orderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Số tiền ký quỹ:</span>
                <span className="font-bold text-emerald-900">
                  {formatVND(amountVnd)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Cơ chế an toàn:</span>
                <span className="font-bold text-emerald-900">
                  48h kiểm tra sau khi nhận
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/orders/${resolvedParams.orderId}`)}
              className="gradient-primary w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:opacity-95"
            >
              Xem chi tiết tiến trình đơn hàng
            </button>
          </div>
        ) : (
          /* Pending Payment — 2-Column Responsive Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {/* Left: VietQR Code Card */}
            <div className="md:col-span-6 bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4 flex flex-col items-center text-center">
              {/* Timer badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Hết hạn sau: {formatCountdown(countdownSec)}</span>
              </div>

              {/* QR Image */}
              <div className="relative aspect-square w-64 max-w-full rounded-2xl overflow-hidden border-2 border-emerald-500/30 p-2 bg-white shadow-xs">
                <Image
                  src={qrUrl}
                  alt="VietQR Escrow"
                  fill
                  className="object-contain p-1"
                />
              </div>

              <p className="text-xs text-slate-500 max-w-xs">
                Mở app ngân hàng bất kỳ để quét mã QR chuyển khoản tự động. Hệ thống sẽ xác nhận ngay trong 3-5 giây.
              </p>

              {/* Live listening indicator */}
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Đang đợi tín hiệu thanh toán từ hệ thống...</span>
              </div>
            </div>

            {/* Right: Bank Details & Escrow Summary */}
            <div className="md:col-span-6 space-y-4">
              {/* Order Info Card */}
              <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Mã giao dịch:</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    #{resolvedParams.orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Số tiền cần chuyển:</span>
                  <span className="text-xl font-black text-emerald-600">
                    {formatVND(amountVnd)}
                  </span>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3 text-xs">
                <h3 className="font-bold text-slate-800 text-sm">
                  Thông tin chuyển khoản thủ công
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ngân hàng:</span>
                      <span className="font-bold text-slate-800">{bankInfo.bankName}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {bankInfo.accountNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bankInfo.accountNumber, 'acc')}
                      className="text-emerald-600 font-bold p-1.5 hover:bg-white rounded-lg transition"
                    >
                      {copiedField === 'acc' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nội dung chuyển:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {bankInfo.transferContent}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bankInfo.transferContent, 'content')}
                      className="text-emerald-600 font-bold p-1.5 hover:bg-white rounded-lg transition"
                    >
                      {copiedField === 'content' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Escrow Guarantee */}
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-3xl p-4 text-xs text-emerald-800 space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-emerald-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Bảo vệ ký quỹ độc lập:
                </p>
                <p>
                  Tiền chuyển vào được giữ an toàn trên Vault PDA. Người bán chỉ nhận được tiền sau khi bạn kiểm tra hàng hài lòng trong 48h.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-xs font-semibold text-slate-400">
          Đang tải trang thanh toán...
        </div>
      }
    >
      <CheckoutContent {...props} />
    </Suspense>
  );
}
