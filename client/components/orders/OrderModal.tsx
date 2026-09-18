'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Check,
  Truck,
  Clock,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { Money } from '@/domain/value-objects/Money';
import { EscrowTimer } from '@/domain/value-objects/EscrowTimer';
import { EscrowOrder } from '@/domain/entities/EscrowOrder';
import { useOrderDetail, useConfirmOrder } from '@/hooks/useMarketplace';
import DisputeModal from '@/components/orders/DisputeModal';

interface OrderModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const STEP_DEFINITIONS = [
  { key: 'LOCKED',    label: 'Đã khóa quỹ',   icon: Check },
  { key: 'SHIPPED',   label: 'Đã giao hàng',  icon: Truck },
  { key: 'DELIVERED', label: 'Kiểm hàng (48h)', icon: Clock },
  { key: 'COMPLETED', label: 'Giải ngân',     icon: Wallet },
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
    default:
      return 1;
  }
}

export default function OrderModal({ orderId, isOpen, onClose }: OrderModalProps) {
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(orderId);
  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmOrder();

  const [countdownStr, setCountdownStr] = useState<string>('--:--:--');

  // Derive EscrowTimer from real order.deliveredAt
  useEffect(() => {
    if (!order?.deliveredAt || order.status !== 'DELIVERED') return;
    const deliveredDate = new Date(order.deliveredAt);
    const timer = new EscrowTimer(new Date(deliveredDate.getTime() + 172800 * 1000));

    const update = () => {
      setCountdownStr(timer.formatCountdown());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order?.deliveredAt, order?.status]);

  if (!isOpen) return null;

  const currentStep = getStepIndex(order?.status ?? 'LOCKED');
  const moneyVnd = new Money(order?.amountVnd ?? 0, 'VND');
  // Safe rate 3,500,000 VND / SOL for on-chain collateral equivalent
  const moneySol = moneyVnd.amount > 0 ? moneyVnd.toSolEquivalent(3500000) : new Money(0, 'SOL');

  const vaultPda =
    order?.id
      ? `Vault48h_${order.id.slice(0, 8)}...${order.id.slice(-6)}`
      : 'VaultPDA_Secured';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-xs font-semibold">Đang tải chi tiết đơn hàng...</span>
          </div>
        )}

        {isError && !isLoading && (
          <div className="py-12 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-neutral-800">
              {(error as any)?.response?.data?.message ?? 'Lỗi tải đơn hàng'}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800"
            >
              Thử lại
            </button>
          </div>
        )}

        {order && !isLoading && (
          <div className="space-y-6">
            {/* Header: real orderId in monospace + live status badge */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold text-neutral-400">Mã đơn hàng</span>
                <p className="font-mono text-sm font-extrabold text-neutral-900">
                  #{order.id}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold border ${
                  order.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : order.status === 'DELIVERED'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : order.status === 'DISPUTED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                {order.status === 'DELIVERED'
                  ? 'Đang kiểm hàng 48h'
                  : order.status === 'COMPLETED'
                  ? 'Đã hoàn tất'
                  : order.status === 'DISPUTED'
                  ? 'Đang khiếu nại'
                  : order.status === 'LOCKED'
                  ? 'Đã khóa quỹ'
                  : order.status}
              </span>
            </div>

            {/* 4-Step Stepper */}
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-4">
              <div className="flex items-center justify-between">
                {STEP_DEFINITIONS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStep > idx + 1;
                  const isCurrent = currentStep === idx + 1;
                  const isDeliveredPulse = isCurrent && step.key === 'DELIVERED';

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
                      {idx > 0 && (
                        <div
                          className={`absolute top-4 -left-1/2 w-full h-0.5 z-0 ${
                            currentStep > idx ? 'bg-emerald-500' : 'bg-neutral-200'
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isDeliveredPulse
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse shadow-md'
                            : isCurrent
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-neutral-200 text-neutral-400'
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>

                      <span
                        className={`mt-2 text-[10px] sm:text-[11px] font-bold ${
                          isCurrent
                            ? 'text-neutral-950'
                            : isDone
                            ? 'text-emerald-700'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 48h Countdown Callout: Active when status === 'DELIVERED' */}
            {order.status === 'DELIVERED' && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Clock className="h-5 w-5 text-amber-700" />
                    <span className="text-xs font-bold">Thời gian kiểm hàng còn lại:</span>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-amber-900 bg-white/80 border border-amber-200 rounded-lg px-2.5 py-1">
                    {countdownStr}
                  </span>
                </div>
                <p className="mt-2 text-xs text-amber-800 leading-relaxed">
                  Bạn có <strong>48 giờ</strong> để kiểm tra kỹ sản phẩm. Nếu không có khiếu nại, tiền sẽ tự động giải ngân cho người bán khi hết giờ.
                </p>
              </div>
            )}

            {/* Product Summary */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-xs">
              {order.listingImage && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                  <Image src={order.listingImage} alt={order.listingTitle} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="truncate text-xs font-bold text-neutral-900">{order.listingTitle}</h4>
                <p className="mt-0.5 text-sm font-extrabold text-emerald-600 font-sans">{moneyVnd.format()}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-400">
                  <span>Người bán: <span className="font-mono text-neutral-700">{order.sellerWallet.slice(0, 8)}...</span></span>
                </div>
              </div>
            </div>

            {/* On-chain Receipt Box */}
            <div className="rounded-2xl border border-neutral-200/90 bg-neutral-900 text-neutral-100 p-4 shadow-sm font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-sans text-[11px] font-bold">Hợp đồng Escrow Vault</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  LOCKED_IN_ESCROW
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Vault PDA:</span>
                <span className="text-emerald-400">{vaultPda}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Ký quỹ VNĐ:</span>
                <span className="text-neutral-200">{moneyVnd.format()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Tương đương SOL:</span>
                <span className="text-neutral-200">{moneySol.format()}</span>
              </div>
            </div>

            {/* Dual Actions: Active for DELIVERED */}
            {order.status === 'DELIVERED' && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeOpen(true)}
                  className="w-full sm:w-1/2 rounded-xl border border-rose-300 bg-rose-50/70 py-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                >
                  Khiếu nại / Báo lỗi
                </button>
                <button
                  type="button"
                  onClick={() => confirmOrder(order.id)}
                  disabled={isConfirming}
                  className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isConfirming ? 'Đang giải ngân...' : 'Đã nhận đúng hàng'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dispute Modal */}
        <DisputeModal
          isOpen={isDisputeOpen}
          onClose={() => setIsDisputeOpen(false)}
          orderId={orderId}
        />
      </div>
    </div>
  );
}

