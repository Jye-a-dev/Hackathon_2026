'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';

const INPUT_CLS =
  'w-full h-11 px-3.5 rounded-xl bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all';

const LABEL_CLS = 'mb-1.5 block text-xs font-semibold text-neutral-700';

const BTN_PRIMARY =
  'w-full h-11 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || searchParams.get('callbackUrl') || '/';
  const { login } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSandbox, setShowSandbox] = useState(true);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!fullName.trim()) { toast.error('Vui lòng nhập họ và tên'); return; }
    if (!cleaned || cleaned.length < 9) { toast.error('Số điện thoại không hợp lệ (tối thiểu 9 số)'); return; }
    if (!agreedTerms) { toast.error('Vui lòng đồng ý với điều khoản ký quỹ'); return; }

    setIsSubmitting(true);
    try {
      const res = await authApi.requestPhoneOtp(cleaned);
      setStep('OTP');
      setResendCooldown(60);
      setShowSandbox(true);
      if (res.testOtp) {
        setTestOtp(res.testOtp);
        toast.info(`Mã thử nghiệm: ${res.testOtp}`);
      } else {
        toast.success('Mã OTP đã được gửi đến số điện thoại');
      }
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
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
    const code = otp.join('');
    if (code.length < 6) { toast.error('Nhập đủ 6 chữ số mã OTP'); return; }
    setIsSubmitting(true);
    try {
      const cleaned = phone.trim().replace(/\s+/g, '');
      const res = await authApi.verifyPhoneOtp(cleaned, code);
      if (res.user && fullName.trim()) res.user.username = fullName.trim();
      login(res.token, res.user);
      toast.success('Đăng ký tài khoản thành công!');
      router.push(redirectParam);
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

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpInputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpInputRefs.current[idx - 1]?.focus();
  };

  const sandboxCode = testOtp || '123456';

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-neutral-200/80 shadow-xl p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 mb-4 shadow-lg">
          <ShieldCheck className="h-6 w-6 text-emerald-400 stroke-[2.5]" />
        </div>
        <h2 className="font-extrabold text-2xl tracking-tight text-neutral-900">Tạo tài khoản mới</h2>
        <p className="mt-1 text-xs text-neutral-500 text-center max-w-xs">
          Bảo vệ 100% người mua &amp; người bán với Ký quỹ 48h tự động
        </p>
      </div>

      {step === 'FORM' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          {/* Full name */}
          <div>
            <label className={LABEL_CLS}>Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                required
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Trần Hoàng Nam"
                className={`${INPUT_CLS} pl-10`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={LABEL_CLS}>Số điện thoại</label>
            <div className="flex h-11 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50/70 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10 focus-within:bg-white transition-all">
              <span className="flex items-center px-3.5 text-xs font-semibold text-neutral-500 border-r border-neutral-200 bg-neutral-100/80 select-none shrink-0">
                🇻🇳 +84
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="912 345 678"
                className="flex-1 bg-transparent px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
              />
            </div>
          </div>

          {/* Sandbox pill */}
          {showSandbox && (
            <div className="bg-emerald-50/60 border border-emerald-200/60 text-emerald-800 text-xs rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>OTP thử nghiệm: <strong className="font-mono font-bold">123456</strong></span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!phone && (
                  <button
                    type="button"
                    onClick={() => { setPhone('0900000001'); setFullName('Nguyễn Văn An'); }}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition"
                  >
                    Điền mẫu
                  </button>
                )}
                <button type="button" onClick={() => setShowSandbox(false)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Terms */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-[11px] leading-relaxed text-neutral-500">
              Tôi đồng ý tuân thủ quy chế kiểm tra hàng hóa 48h và bảo vệ ký quỹ tự động của TrustPass.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim() || !phone.trim() || !agreedTerms}
            className={BTN_PRIMARY}
          >
            {isSubmitting
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <><span>Tiếp tục xác thực OTP</span><ArrowRight className="h-4 w-4" /></>
            }
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Phone display */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-xs">
            <span className="text-neutral-600">Gửi đến: <strong className="text-neutral-900">{phone}</strong></span>
            <button type="button" onClick={() => { setStep('FORM'); setOtp(['','','','','','']); }} className="font-semibold text-neutral-900 hover:underline">
              Sửa
            </button>
          </div>

          {/* Sandbox pill */}
          {showSandbox && (
            <div className="bg-emerald-50/60 border border-emerald-200/60 text-emerald-800 text-xs rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>Mã xác thực: <strong className="font-mono font-bold">{sandboxCode}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const digits = sandboxCode.split('').slice(0, 6);
                    setOtp(digits.concat(Array(Math.max(0, 6 - digits.length)).fill('')));
                  }}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition"
                >
                  Điền mã
                </button>
                <button type="button" onClick={() => setShowSandbox(false)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* OTP boxes */}
          <div>
            <label className={LABEL_CLS}>Mã OTP 6 chữ số</label>
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 text-center font-mono text-lg font-bold text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:bg-white"
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
              className="font-semibold text-neutral-900 hover:underline disabled:text-neutral-400"
            >
              {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại mã'}
            </button>
          </div>

          <button type="submit" disabled={isSubmitting || otp.join('').length < 6} className={BTN_PRIMARY}>
            {isSubmitting
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <><FileCheck2 className="h-4 w-4" /><span>Hoàn tất đăng ký</span></>
            }
          </button>
        </form>
      )}

      {/* Footer guarantee */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
        <Lock className="h-3.5 w-3.5 text-emerald-500" />
        <span>Bảo mật end-to-end qua OTP &amp; Hợp đồng Ký quỹ Solana</span>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-5 text-center text-xs text-neutral-500">
        Đã có tài khoản?{' '}
        <Link href={`/auth/login?redirect=${encodeURIComponent(redirectParam)}`} className="font-bold text-neutral-900 hover:underline">
          Đăng nhập ngay
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-neutral-400">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span>Solana Devnet Smart Contract Verified</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-neutral-400" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
