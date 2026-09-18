import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  QrCode,
  PackageCheck,
  Timer,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Xác thực tài khoản | TrustPass',
  description: 'Đăng nhập hoặc đăng ký tài khoản TrustPass',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row">
      {/* ─── LEFT BRAND HERO PANEL (Desktop Full Height) ─── */}
      <section className="relative hidden w-full flex-col justify-between overflow-hidden border-r border-neutral-800/80 bg-neutral-950 p-10 text-white lg:flex lg:w-[48%] xl:w-[50%]">
        {/* Ambient Gradient Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-[130px]" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/25 transition group-hover:scale-105">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white">Chợ Ký Quỹ</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                P2P Escrow Engine
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-xs font-semibold text-neutral-300 backdrop-blur-md transition hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Về trang chủ
          </Link>
        </div>

        {/* Center Value Proposition */}
        <div className="relative z-10 my-auto max-w-lg space-y-6 py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Bảo vệ người mua & người bán 100%
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl xl:text-5xl leading-tight">
            Giao dịch an tâm với{' '}
            <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Ký quỹ 48 Giờ
            </span>
          </h1>

          <p className="text-sm leading-relaxed text-neutral-400">
            Hệ thống giữ tiền cọc qua hợp đồng thông minh và VietQR động. Tiền chỉ giải ngân khi bạn đã nhận hàng, kiểm tra thực tế và ấn xác nhận hài lòng.
          </p>

          {/* 3-Step Visual Escrow Flow */}
          <div className="space-y-3 rounded-2xl border border-neutral-800/90 bg-neutral-900/60 p-4.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
                <QrCode className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">1. Quét VietQR khoá tiền an toàn</p>
                <p className="text-[11px] text-neutral-400">Tiền được bảo vệ trong tài khoản ký quỹ trung gian</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
                <PackageCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">2. Người bán bàn giao sản phẩm</p>
                <p className="text-[11px] text-neutral-400">Hỗ trợ giao hàng hỏa tốc hoặc gặp mặt trực tiếp</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
                <Timer className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">3. 48 Giờ đồng kiểm tra hàng</p>
                <p className="text-[11px] text-neutral-400">Hài lòng mới giải ngân, có lỗi được trọng tài hoàn tiền</p>
              </div>
            </div>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
              <p className="text-lg font-bold text-white">10.000+</p>
              <p className="text-[10px] text-neutral-400">Giao dịch an toàn</p>
            </div>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
              <p className="text-lg font-bold text-emerald-400">100%</p>
              <p className="text-[10px] text-neutral-400">Bảo vệ tiền cọc</p>
            </div>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3">
              <p className="text-lg font-bold text-cyan-400">48h</p>
              <p className="text-[10px] text-neutral-400">Thời gian đồng kiểm</p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof & Trust Badges */}
        <div className="relative z-10 border-t border-neutral-800/80 pt-6">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Xác thực danh tính số 1 Việt Nam</span>
            </div>
            <span>© 2026 Chợ Ký Quỹ</span>
          </div>
        </div>
      </section>

      {/* ─── RIGHT FORM CONTAINER (Light, Crisp, Premium Card) ─── */}
      <section className="relative flex flex-1 flex-col justify-between overflow-y-auto bg-neutral-50 px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
        {/* Mobile Header */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950 font-black shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-base font-bold text-neutral-900">Chợ Ký Quỹ</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-xs hover:text-neutral-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
        </div>

        {/* Dynamic Form Page Mount */}
        <div className="my-auto flex w-full justify-center">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-neutral-500">
          Bằng việc tiếp tục, bạn đồng ý với{' '}
          <span className="font-medium text-neutral-800 hover:underline cursor-pointer">Điều khoản dịch vụ</span> và{' '}
          <span className="font-medium text-neutral-800 hover:underline cursor-pointer">Chính sách ký quỹ 48h</span>.
        </div>
      </section>
    </div>
  );
}
