'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  ArrowRight,
  RefreshCw,
  Wallet,
  KeyRound,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';

type AuthMethod = 'PHONE' | 'GOOGLE' | 'WALLET';

const INPUT_CLS =
  'w-full h-11 px-3.5 rounded-xl bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all';

const LABEL_CLS = 'mb-1.5 block text-xs font-semibold text-neutral-700';

const BTN_PRIMARY =
  'w-full h-11 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || searchParams.get('callbackUrl') || '/';
  const { login, isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn) router.replace(redirectParam);
  }, [isLoggedIn, router, redirectParam]);

  const [method, setMethod] = useState<AuthMethod>('PHONE');

  // Phone OTP
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [testOtpNotice, setTestOtpNotice] = useState<string | null>(null);
  const [showSandbox, setShowSandbox] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  // Web3
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!cleaned || cleaned.length < 9) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)');
      return;
    }
    setIsRequestingOtp(true);
    setTestOtpNotice(null);
    try {
      const res = await authApi.requestPhoneOtp(cleaned);
      setOtpSent(true);
      setResendCooldown(60);
      setShowSandbox(true);
      if (res.testOtp) {
        setTestOtpNotice(res.testOtp);
        toast.info(`Mã thử nghiệm: ${res.testOtp}`);
      } else {
        toast.success('Mã OTP đã được gửi!');
      }
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Không thể gửi mã OTP.';
      toast.error(msg);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[index] = val.slice(-1);
    setOtp(next);
    if (val && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Nhập đủ 6 chữ số OTP'); return; }
    setIsVerifyingOtp(true);
    try {
      const res = await authApi.verifyPhoneOtp(phone.trim().replace(/\s+/g, ''), code);
      login(res.token, res.user);
      toast.success('Đăng nhập thành công!');
      router.push(redirectParam);
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

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) { toast.error('Nhập địa chỉ Gmail'); return; }
    setIsSubmittingGoogle(true);
    try {
      const res = await authApi.loginWithGoogle({ email: googleEmail.trim(), fullName: googleName.trim() || undefined });
      login(res.token, res.user);
      toast.success('Đăng nhập Google thành công!');
      router.push(redirectParam);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message || 'Đăng nhập Google thất bại.';
      toast.error(msg);
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleConnectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) { toast.error('Nhập địa chỉ ví Solana'); return; }
    setIsConnectingWallet(true);
    try {
      const res = await authApi.connectWallet(walletAddress.trim());
      login(res.token, res.user);
      toast.success('Kết nối ví & đăng nhập thành công!');
      router.push(redirectParam);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message || 'Không thể kết nối ví.';
      toast.error(msg);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const sandboxCode = testOtpNotice || '123456';

  return (
    <div className="w-full max-w-md mx-auto my-12 bg-white rounded-3xl border border-neutral-200/80 shadow-2xl p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 mb-4 shadow-lg">
          <ShieldCheck className="h-6 w-6 text-emerald-400 stroke-[2.5]" />
        </div>
        <h2 className="font-extrabold text-2xl tracking-tight text-neutral-900">Đăng nhập TrustPass</h2>
        <p className="mt-1 text-xs text-neutral-500 text-center max-w-xs">
          Hệ thống mua bán đồ cũ an toàn với Ký quỹ bảo vệ 48h
        </p>
      </div>

      {/* Segmented Auth Tabs */}
      <div className="flex rounded-2xl bg-neutral-100 p-1 mb-6 gap-1">
        {([
          { id: 'PHONE' as const, label: 'Số điện thoại', icon: Smartphone },
          { id: 'GOOGLE' as const, label: 'Google', icon: Mail },
          { id: 'WALLET' as const, label: 'Ví Solana', icon: Wallet },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setMethod(id); setOtpSent(false); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
              method === id
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── PHONE OTP ── */}
      {method === 'PHONE' && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Số điện thoại</label>
                <div className="flex h-11 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50/70 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10 focus-within:bg-white transition-all">
                  <span className="flex items-center px-3.5 text-xs font-semibold text-neutral-500 border-r border-neutral-200 bg-neutral-100/80 select-none shrink-0">
                    🇻🇳 +84
                  </span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="912 345 678"
                    className="flex-1 bg-transparent px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
                  />
                </div>
              </div>

              {/* Dev Sandbox Pill */}
              {showSandbox && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>OTP thử nghiệm: <strong className="font-mono font-bold">123456</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPhone('0900000001');
                      }}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition cursor-pointer"
                    >
                      Điền mã tự động
                    </button>
                    <button type="button" onClick={() => setShowSandbox(false)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isRequestingOtp || !phone.trim()} className={BTN_PRIMARY}>
                {isRequestingOtp
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <><span>Tiếp tục xác thực OTP</span><ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Phone display */}
              <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-xs">
                <span className="text-neutral-600">Mã gửi đến: <strong className="text-neutral-900">{phone}</strong></span>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(['','','','','','']); }} className="font-semibold text-neutral-900 hover:underline">
                  Thay đổi
                </button>
              </div>

              {/* Sandbox pill */}
              {showSandbox && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
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
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition cursor-pointer"
                    >
                      Điền mã tự động
                    </button>
                    <button type="button" onClick={() => setShowSandbox(false)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* OTP 6-digit inputs */}
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

              <button type="submit" disabled={isVerifyingOtp || otp.join('').length < 6} className={BTN_PRIMARY}>
                {isVerifyingOtp
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <><KeyRound className="h-4 w-4" /><span>Xác nhận &amp; Đăng nhập</span></>
                }
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── GOOGLE ── */}
      {method === 'GOOGLE' && (
        <form onSubmit={handleGoogleLogin} className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Địa chỉ Gmail</label>
            <input
              type="email"
              required
              autoFocus
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="tenban@gmail.com"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>
              Tên hiển thị <span className="text-neutral-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              type="text"
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className={INPUT_CLS}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingGoogle || !googleEmail.trim()}
            className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-semibold text-neutral-800 shadow-sm transition-all active:scale-[0.99] disabled:opacity-40"
          >
            {isSubmittingGoogle ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Tiếp tục với Google</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ── WALLET ── */}
      {method === 'WALLET' && (
        <form onSubmit={handleConnectWallet} className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Địa chỉ ví Solana</label>
            <input
              type="text"
              autoFocus
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className={`${INPUT_CLS} font-mono text-xs`}
            />
          </div>
          <button type="submit" disabled={isConnectingWallet || !walletAddress.trim()} className={BTN_PRIMARY}>
            {isConnectingWallet
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <><Wallet className="h-4 w-4" /><span>Kết nối ví Solana</span></>
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
        Chưa có tài khoản?{' '}
        <Link href={`/auth/register?redirect=${encodeURIComponent(redirectParam)}`} className="font-bold text-neutral-900 hover:underline">
          Tạo tài khoản mới
        </Link>
      </div>

      {/* Back to verify badge */}
      <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-neutral-400">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span>Solana Devnet Smart Contract Verified</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-neutral-400" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
