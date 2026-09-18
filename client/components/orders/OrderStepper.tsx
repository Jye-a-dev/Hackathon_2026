'use client';

import { Check, Truck, Clock, Wallet, AlertTriangle } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

interface OrderStepperProps {
  status: OrderStatus;
}

const steps = [
  { key: 'LOCKED',    label: 'Đã khóa quỹ',   desc: 'Khóa quỹ an toàn', icon: Check },
  { key: 'SHIPPED',   label: 'Đã giao hàng',  desc: 'Đang vận chuyển',   icon: Truck },
  { key: 'DELIVERED', label: 'Kiểm hàng (48h)', desc: 'Đang kiểm tra',    icon: Clock },
  { key: 'COMPLETED', label: 'Giải ngân',     desc: 'Giải ngân seller',  icon: Wallet },
];

function getStepIndex(status: OrderStatus): number {
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
      return 0;
    default:
      return 1;
  }
}

export default function OrderStepper({ status }: OrderStepperProps) {
  const currentStep = getStepIndex(status);

  if (status === 'DISPUTED') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900">Đơn hàng đang trong trạng thái Khiếu nại</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Tiền ký quỹ tạm hoãn giải ngân. Trọng tài đang xem xét bằng chứng unbox để phân xử.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
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
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>

              <span
                className={`mt-2 text-[10px] sm:text-[11px] font-bold ${
                  isCurrent ? 'text-neutral-900' : isDone ? 'text-emerald-700' : 'text-neutral-400'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[9px] text-neutral-400 hidden sm:block">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
