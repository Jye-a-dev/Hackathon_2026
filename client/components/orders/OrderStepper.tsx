'use client';

import { Check, Clock, Package, Truck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Check, Package, Truck, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

interface OrderStepperProps {
  status: OrderStatus;
}

const steps = [
  { key: 'LOCKED', label: 'Đã ký quỹ', desc: 'Tiền khóa an toàn', icon: ShieldCheck },
  { key: 'SHIPPED', label: 'Đang giao', desc: 'Đang vận chuyển', icon: Truck },
  { key: 'DELIVERED', label: 'Đã nhận', desc: '48h kiểm hàng', icon: Package },
  { key: 'COMPLETED', label: 'Hoàn tất', desc: 'Giải ngân seller', icon: Check },
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
      return 3; // In dispute after delivery
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
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900">Đơn hàng đang có khiếu nại (Tranh chấp)</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Tiền ký quỹ tạm hoãn giải ngân. Quản trị viên đang xem xét bằng chứng unbox của hai bên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = currentStep > idx + 1;
          const isCurrent = currentStep === idx + 1;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`absolute top-4 -left-1/2 w-full h-0.5 -z-0 ${
                    currentStep > idx ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step Icon */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? 'gradient-primary text-white ring-4 ring-emerald-100 scale-110 shadow-md'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>

              {/* Step text */}
              <span
                className={`mt-2 text-[11px] font-bold ${
                  isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[9px] text-slate-400 hidden sm:block">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
