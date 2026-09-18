'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  Smartphone,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Wallet,
  KeyRound,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';

type AuthMethod = 'PHONE' | 'GOOGLE' | 'WALLET';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { login, isLoggedIn } = useAuthStore();

  // If already authenticated, redirect
  useEffect(() => {
    if (isLoggedIn) {
      router.replace(callbackUrl);
    }
  }, [isLoggedIn, router, callbackUrl]);

  const [method, setMethod] = useState<AuthMethod>('PHONE');

  // Phone OTP States
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [testOtpNotice, setTestOtpNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google States
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  // Web3 States
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle phone submission to request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)');
      return;
    }

    setIsRequestingOtp(true);
    setTestOtpNotice(null);
    try {
      const res = await authApi.requestPhoneOtp(cleanPhone);
      setOtpSent(true);
      setResendCooldown(60);
      if (res.testOtp) {
        setTestOtpNotice(res.testOtp);
        toast.info(`Mã thử nghiệm hệ thống: ${res.testOtp}`);
      } else {
        toast.success('Mã OTP đã được gửi đến số điện thoại của bạn!');
      }
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Không thể gửi mã OTP. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      const res = await authApi.verifyPhoneOtp(cleanPhone, otpCode);
      login(res.token);
      toast.success('Đăng nhập thành công!');
      router.push(callbackUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Mã OTP không hợp lệ hoặc đã hết hạn.';
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Google Login submission
  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      toast.error('Vui lòng nhập địa chỉ Gmail');
      return;
    }

    setIsSubmittingGoogle(true);
    try {
      const res = await authApi.loginWithGoogle({
        email: googleEmail.trim(),
        fullName: googleName.trim() || undefined,
      });
      login(res.token);
      toast.success('Đăng nhập Google thành công!');
      router.push(callbackUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Đăng nhập Google thất bại.';
      toast.error(msg);
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  // Solana Wallet Login
  const handleConnectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ ví Solana');
      return;
    }

    setIsConnectingWallet(true);
    try {
      const res = await authApi.connectWallet(walletAddress.trim());
      login(res.token);
      toast.success('Kết nối ví & đăng nhập thành công!');
      router.push(callbackUrl);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Không thể kết nối ví.';
      toast.error(msg);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-neutral-900/5">
      {/* Title Header */}
      <div className="space-y-1 text-center sm:text-left mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 mb-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ký quỹ 48h bảo vệ
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Đăng nhập tài khoản
        </h2>
        <p className="text-sm text-neutral-500">
          Chọn phương thức thuận tiện để bắt đầu giao dịch ký quỹ an toàn.
        </p>
      </div>

      {/* Auth Method Tabs */}
      <div className="flex rounded-2xl bg-neutral-100 p-1 ring-1 ring-neutral-200/60 mb-6">
        <button
          type="button"
          onClick={() => {
            setMethod('PHONE');
            setOtpSent(false);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
            method === 'PHONE'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Số điện thoại</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('GOOGLE')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
            method === 'GOOGLE'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('WALLET')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
            method === 'WALLET'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>Ví Solana</span>
        </button>
      </div>

      {/* ─── METHOD 1: PHONE OTP ─── */}
      {method === 'PHONE' && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Số điện thoại Việt Nam
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">
                    +84
                  </span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 py-3.5 pl-14 pr-4 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Sandbox Quick Tip */}
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="leading-tight">
                  Thử nghiệm nhanh: Mã OTP mặc định là <strong className="font-mono font-bold text-emerald-700">123456</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp || !phone.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50"
              >
                {isRequestingOtp ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Gửi mã xác thực OTP</span>
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
                    Gửi đến: <strong className="text-neutral-900 font-semibold">{phone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Thay đổi số
                  </button>
                </div>
              </div>

              {testOtpNotice && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
                  <span>
                    Mã OTP thử nghiệm: <strong className="font-mono text-sm tracking-wider text-emerald-700">{testOtpNotice}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = testOtpNotice.slice(0, 6).split('');
                      setOtp(digits);
                    }}
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
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
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
                disabled={isVerifyingOtp || otp.join('').length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Xác nhận & Đăng nhập</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─── METHOD 2: GOOGLE ─── */}
      {method === 'GOOGLE' && (
        <form onSubmit={handleGoogleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Địa chỉ Gmail
            </label>
            <input
              type="email"
              required
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="tenban@gmail.com"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Tên hiển thị <span className="text-neutral-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              type="text"
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingGoogle || !googleEmail.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3.5 text-sm font-bold text-neutral-800 shadow-xs transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmittingGoogle ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ─── METHOD 3: SOLANA WALLET ─── */}
      {method === 'WALLET' && (
        <form onSubmit={handleConnectWallet} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Địa chỉ ví Solana (Phantom / Solflare)
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="VD: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3.5 font-mono text-xs text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <button
            type="submit"
            disabled={isConnectingWallet}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
          >
            {isConnectingWallet ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                <span>Kết nối & Đăng nhập Ví</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Security note */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span>Bảo mật 2 lớp qua OTP & Ký quỹ an toàn</span>
      </div>

      {/* Switch to Register link */}
      <div className="mt-5 border-t border-neutral-100 pt-5 text-center text-xs text-neutral-500">
        Chưa có tài khoản?{' '}
        <Link
          href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-emerald-600 hover:underline"
        >
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
