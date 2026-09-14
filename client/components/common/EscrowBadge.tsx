'use client';

import { ShieldCheck, Clock } from 'lucide-react';

interface EscrowBadgeProps {
  variant?: 'full' | 'compact';
}

export default function EscrowBadge({ variant = 'full' }: EscrowBadgeProps) {
  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <ShieldCheck className="h-3.5 w-3.5" />
        Ký quỹ an toàn
      </span>
    );
  }

  return (
    <div className="escrow-badge animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">
            🔒 Bảo vệ người mua 48h
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
            Tiền chỉ chuyển cho người bán sau 48 giờ khi bạn nhận đúng hàng và bấm xác nhận.
            Không vừa ý? Hoàn tiền 100%.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Thời gian kiểm tra hàng: 48 giờ sau khi nhận</span>
          </div>
        </div>
      </div>
    </div>
  );
}
