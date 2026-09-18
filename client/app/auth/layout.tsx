import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  QrCode,
  Scale,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Xác thực tài khoản | TrustPass',
  description: 'Đăng nhập hoặc đăng ký tài khoản TrustPass - Mua bán P2P Ký Quỹ 48h',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#fafafa]">
      {/* ─── CỘT TRÁI (Branding & Trust - 50% Desktop) ─── */}
      <section className="relative hidden w-full lg:w-1/2 flex-col justify-between overflow-hidden bg-neutral-900 p-10 lg:p-14 text-white lg:flex border-r border-neutral-800/60">
        {/* Subtle Luxury Mesh Gradient & Emerald Glow */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-950/40 via-neutral-900 to-neutral-900" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[140px]" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-emerald-400 shadow-sm backdrop-blur-md transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white">TrustPass</span>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Chợ Ký Quỹ P2P
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-1.5 text-xs font-medium text-neutral-400 backdrop-blur-md transition hover:border-neutral-700 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Center: Hero & 3 Commitments */}
        <div className="relative z-10 my-auto max-w-lg space-y-8 py-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Cơ chế bảo vệ thanh toán tự động</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-snug">
              Mua bán đồ cũ an tâm.<br />
              <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Tuyệt đối không rủi ro.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
              Hệ thống ký quỹ thông minh giải quyết triệt để rủi ro bùng cọc và lừa đảo trực tuyến tại Việt Nam.
            </p>
          </div>

          {/* 3 Core Commitments */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/3 p-4 backdrop-blur-xs transition hover:bg-white/5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  1. Khóa tiền bảo vệ người mua 48h
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Tiền cược được giữ an toàn trong quỹ trung gian. Người bán chỉ nhận tiền khi bạn kiểm tra và xác nhận hài lòng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/3 p-4 backdrop-blur-xs transition hover:bg-white/5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <QrCode className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  2. Thanh toán tức thì qua VietQR tự động
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Chuyển khoản Napas 24/7 với mã QR động, khớp đơn tự động trong vài giây mà không cần thao tác thủ công.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/3 p-4 backdrop-blur-xs transition hover:bg-white/5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Scale className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  3. Trọng tài phân xử minh bạch khi có tranh chấp
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Hỗ trợ khiếu nại bằng chứng thực tế, hoàn tiền 100% về ví khi hàng không đúng mô tả hoặc phát sinh sự cố.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="relative z-10 border-t border-neutral-800/80 pt-6 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Solana Devnet Smart Contract Verified</span>
          <span>© 2026 TrustPass / Chợ Ký Quỹ</span>
        </div>
      </section>

      {/* ─── CỘT PHẢI (Form Interaction - 50% Desktop) ─── */}
      <section className="relative flex flex-1 flex-col justify-between overflow-y-auto bg-[#fafafa] px-4 py-8 sm:px-8 lg:px-12">
        {/* Mobile Header */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-emerald-400 font-bold shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-sm font-extrabold text-neutral-900">TrustPass</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-2xs hover:text-neutral-900"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Dynamic Form Mount (max-w-md w-full mx-auto) */}
        <div className="my-auto flex w-full justify-center py-6">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Minimal Footer Policy Note */}
        <div className="mt-6 text-center text-[11px] text-neutral-400">
          Giao dịch được bảo vệ theo{' '}
          <span className="font-semibold text-neutral-700 hover:underline cursor-pointer">Quy chế Ký quỹ 48h</span>.
        </div>
      </section>
    </div>
  );
}
