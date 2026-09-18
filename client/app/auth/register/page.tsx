'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { login } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // OTP Step
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)');
      return;
    }
    if (!agreedTerms) {
      toast.error('Vui lòng đồng ý với điều khoản ký quỹ để tiếp tục');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.requestPhoneOtp(cleanPhone);
      setStep('OTP');
      setResendCooldown(60);
      if (res.testOtp) {
        setTestOtp(res.testOtp);
        toast.info(`Mã thử nghiệm hệ thống: ${res.testOtp}`);
      } else {
        toast.success('Mã OTP xác thực đã được gửi đến số điện thoại');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Không thể gửi mã xác nhận.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      const res = await authApi.verifyPhoneOtp(cleanPhone, otpCode);
      login(res.token);
      toast.success('Đăng ký tài khoản thành công!');
      router.push(callbackUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Mã OTP không hợp lệ.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-neutral-900/5">
      <div className="space-y-1 text-center sm:text-left mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 mb-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Tham gia Chợ Ký Quỹ
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Tạo tài khoản mới
        </h2>
        <p className="text-sm text-neutral-500">
          Gia nhập mạng lưới mua bán P2P có bảo vệ ký quỹ 48h an toàn nhất.
        </p>
      </div>

      {step === 'FORM' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                required
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Trần Hoàng Nam"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Số điện thoại xác thực
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">
                +84
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 py-3.5 pl-14 pr-4 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          {/* Sandbox helper */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs text-emerald-800">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="leading-tight">
              Thử nghiệm nhanh: Mã OTP mặc định là <strong className="font-mono font-bold text-emerald-700">123456</strong>
            </span>
          </div>

          {/* Terms checkbox */}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="leading-tight text-neutral-500">
              Tôi đồng ý tuân thủ quy chế kiểm tra hàng hóa trong vòng 48h và thanh toán an toàn qua hợp đồng ký quỹ.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim() || !phone.trim() || !agreedTerms}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Tiếp tục xác thực OTP</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-600">
                Gửi mã xác thực đăng ký đến: <strong className="text-neutral-900 font-semibold">{phone}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Sửa
              </button>
            </div>
          </div>

          {testOtp && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
              <span>
                Mã kiểm thử: <strong className="font-mono text-sm tracking-wider text-emerald-700">{testOtp}</strong>
              </span>
              <button
                type="button"
                onClick={() => setOtp(testOtp.slice(0, 6).split(''))}
                className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs transition hover:bg-emerald-500"
              >
                Tự điền
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Nhập mã OTP 6 chữ số
            </label>
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) return;
                    const nextOtp = [...otp];
                    nextOtp[idx] = val.slice(-1);
                    setOtp(nextOtp);
                  }}
                  className="h-13 w-12 rounded-xl border border-neutral-200 bg-neutral-50/60 text-center font-mono text-xl font-bold text-neutral-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Chưa nhận được mã?</span>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleRequestOtp}
              className="font-semibold text-emerald-600 hover:underline disabled:text-neutral-400"
            >
              {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.join('').length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FileCheck2 className="h-4 w-4" />
                <span>Hoàn tất đăng ký</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Switch to Login link */}
      <div className="mt-5 border-t border-neutral-100 pt-5 text-center text-xs text-neutral-500">
        Đã có tài khoản?{' '}
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-emerald-600 hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
