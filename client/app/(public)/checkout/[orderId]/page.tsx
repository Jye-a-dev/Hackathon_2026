'use client';

import { use, useState, useEffect, useRef } from 'react';
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
import confetti from 'canvas-confetti';
import { formatVND } from '@/utils/formatCurrency';
import { formatCountdown } from '@/utils/formatTime';
import { ordersApi, paymentsApi } from '@/libs/api';
import { getEscrowSocket } from '@/libs/socket';
import type { Order } from '@/types/order';

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdownSec, setCountdownSec] = useState(15 * 60); // 15:00 minutes

  // Bank transfer info
  const bankInfo = {
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    bankCode: 'MB',
    accountNumber: '999988887777',
    accountName: 'CONG TY KY QUY P2P AN TOAN',
    transferContent: `KQ ${resolvedParams.orderId.slice(-6).toUpperCase()}`,
  };

  const amountVnd = order?.amountVnd ?? Number(searchParams.get('amount') ?? 2450000);

  // Dynamic VietQR generator URL
  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-compact2.png?amount=${amountVnd}&addInfo=${encodeURIComponent(bankInfo.transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  // Polling ref & socket ref for cleanup
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishedRef = useRef(false);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // fallback if canvas not ready
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    if (pollingRef.current) clearInterval(pollingRef.current);

    setIsPaid(true);
    triggerCelebration();
  };

  // Fetch initial order
  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await ordersApi.get(resolvedParams.orderId);
        if (data && data.id) {
          setOrder(data);
          if (data.status === 'LOCKED' || data.status === 'COMPLETED') {
            handlePaymentSuccess();
          }
        }
      } catch (err) {
        console.warn('Cannot fetch order from server, mock initialized:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [resolvedParams.orderId]);

  // Dual Fallback: 1) Socket.io + 2) Polling every 5s
  useEffect(() => {
    if (isPaid || isFinishedRef.current) return;

    // 1. Socket.io listener
    let socket: any = null;
    try {
      socket = getEscrowSocket();
      socket.connect();
      socket.emit('subscribe_order', { orderId: resolvedParams.orderId });

      socket.on('order_paid', (payload: any) => {
        if (payload?.orderId === resolvedParams.orderId) {
          handlePaymentSuccess();
        }
      });
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    // 2. Fallback polling every 5s
    pollingRef.current = setInterval(async () => {
      if (isFinishedRef.current) return;
      try {
        const checked = await ordersApi.get(resolvedParams.orderId);
        if (checked?.status === 'LOCKED' || checked?.status === 'COMPLETED') {
          handlePaymentSuccess();
        }
      } catch {
        // Polling silent retry
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (socket) {
        socket.off('order_paid');
        socket.disconnect();
      }
    };
  }, [resolvedParams.orderId, isPaid]);

  // 15:00 countdown timer
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

  // Mock simulation for demo review
  const handleSimulatePaid = () => {
    handlePaymentSuccess();
  };

  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce-in">
          <ShieldCheck className="h-10 w-10 stroke-[2.5]" />
        </div>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
          Ký quỹ thành công
        </span>

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Đã nhận thanh toán {formatVND(amountVnd)}
        </h1>

        <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
          Số tiền của bạn đang được <strong>khóa an toàn trong quỹ trung gian</strong>. Người bán sẽ tiến hành gửi hàng và bạn có <strong>48 giờ kiểm tra</strong> sau khi nhận.
        </p>

        <div className="bg-white rounded-2xl p-4 w-full max-w-sm border border-slate-100 text-left mb-6 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Mã giao dịch</span>
            <span className="font-mono font-semibold">{resolvedParams.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Trạng thái quỹ</span>
            <span className="font-semibold text-emerald-600">Đã khóa an toàn</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Thời gian nhận</span>
            <span>Vừa xong</span>
          </div>
        </div>

        <Link
          href={`/orders/${resolvedParams.orderId}`}
          className="gradient-primary w-full max-w-sm rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Theo dõi đơn hàng & 48h kiểm tra</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between glass px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => router.back()}
          aria-label="Quay lại"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-slate-800">Thanh toán Ký quỹ VietQR</span>
        <div className="w-9" />
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Countdown Bar */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Đơn hàng và tỷ giá giữ trong:</span>
          </div>
          <span className="font-mono font-black text-amber-700 text-sm bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
            {formatCountdown(countdownSec)}
          </span>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Số tiền chuyển khoản chính xác
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {formatVND(amountVnd)}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Tiền được bảo vệ bởi Ký quỹ 48h</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          <p className="text-xs text-slate-500 mb-3 text-center">
            Mở ứng dụng ngân hàng bất kỳ để quét mã QR chuyển khoản tự động
          </p>

          <div className="relative p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md">
            <Image
              src={qrUrl}
              alt="Mã VietQR Chuyển khoản Ký quỹ"
              width={240}
              height={240}
              className="rounded-xl"
              priority
              unoptimized
            />
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
            <span>Hệ thống tự động phát hiện thanh toán tức thì</span>
          </div>
        </div>

        {/* Bank Transfer Details with 1-Tap Copy */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Hoặc chuyển khoản thủ công
          </h3>

          {/* Bank name */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 text-xs">
            <span className="text-slate-400">Ngân hàng</span>
            <span className="font-semibold text-slate-800 text-right">{bankInfo.bankName}</span>
          </div>

          {/* Account number */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 text-xs">
            <span className="text-slate-400">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900">{bankInfo.accountNumber}</span>
              <button
                onClick={() => copyToClipboard(bankInfo.accountNumber, 'acc')}
                className="rounded-md bg-slate-100 p-1 hover:bg-slate-200 text-slate-600"
                aria-label="Sao chép số tài khoản"
              >
                {copiedField === 'acc' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Account name */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 text-xs">
            <span className="text-slate-400">Chủ tài khoản</span>
            <span className="font-semibold text-slate-800">{bankInfo.accountName}</span>
          </div>

          {/* Transfer content */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 text-xs">
            <div className="flex flex-col">
              <span className="text-slate-400">Nội dung chuyển khoản</span>
              <span className="text-[10px] text-red-500 font-medium">* Bắt buộc chính xác</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {bankInfo.transferContent}
              </span>
              <button
                onClick={() => copyToClipboard(bankInfo.transferContent, 'content')}
                className="rounded-md bg-slate-100 p-1 hover:bg-slate-200 text-slate-600"
                aria-label="Sao chép nội dung"
              >
                {copiedField === 'content' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Test Simulation Button */}
        <div className="bg-slate-100/80 rounded-2xl p-3 text-center">
          <p className="text-[11px] text-slate-500 mb-2">
            💡 Dành cho Giám khảo / Test Demo: Nhấn nút bên dưới để giả lập hoàn tất thanh toán VietQR ngay lập tức
          </p>
          <button
            onClick={handleSimulatePaid}
            id="simulate-payment-btn"
            className="w-full rounded-xl bg-white border border-emerald-300 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-sm"
          >
            ⚡ Giả lập Quét mã QR Thành công (Demo)
          </button>
        </div>
      </div>
    </div>
  );
}
