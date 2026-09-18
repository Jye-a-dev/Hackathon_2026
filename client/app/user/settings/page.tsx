'use client';

import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  CreditCard,
  MapPin,
  LogOut,
  Save,
  CheckCircle2,
  RefreshCw,
  Camera,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useMarketplace';
import { http } from '@/libs/api';
import Image from 'next/image';
import { performFullLogout } from '@/libs/logout';

const INPUT_CLS =
  'w-full h-11 px-3.5 rounded-xl bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all';

const LABEL_CLS = 'mb-1.5 block text-xs font-semibold text-neutral-700';

const BANKS = [
  { code: 'VCB',    name: 'Vietcombank',  color: '#00580A' },
  { code: 'MB',     name: 'MB Bank',      color: '#00509F' },
  { code: 'TCB',    name: 'Techcombank',  color: '#D0021B' },
  { code: 'ACB',    name: 'ACB',          color: '#EA272A' },
  { code: 'VPB',    name: 'VPBank',       color: '#00A850' },
  { code: 'VIB',    name: 'VIB',          color: '#006DB7' },
  { code: 'TPB',    name: 'TPBank',       color: '#882B7C' },
  { code: 'BIDV',   name: 'BIDV',         color: '#006F3C' },
  { code: 'VTB',    name: 'Vietinbank',   color: '#004A97' },
  { code: 'SCB',    name: 'Sacombank',    color: '#005BAA' },
  { code: 'MSB',    name: 'MSB',          color: '#E31837' },
];

type Section = 'profile' | 'bank' | 'address' | 'security';

export default function UserSettingsPage() {
  const queryClient = useQueryClient();
  const { data: user, refetch } = useCurrentUser();

  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saving, setSaving] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();

  // Bank state
  const [bankCode, setBankCode] = useState('VCB');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');

  // Address state
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('TP. Hồ Chí Minh');

  const saveProfile = async () => {
    setSaving(true);
    try {
      await http.patch('/users/me', { fullName, email });
      await refetch();
      toast.success('Đã cập nhật thông tin cá nhân');
    } catch {
      toast.error('Không thể lưu. Thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async () => {
    if (!accountNo.trim() || !accountName.trim()) { toast.error('Nhập đầy đủ số tài khoản và tên chủ tài khoản'); return; }
    setSaving(true);
    try {
      await http.patch('/users/me', { bankCode, bankAccountNo: accountNo.trim(), bankAccountName: accountName.toUpperCase().trim() });
      toast.success('Đã cập nhật tài khoản ngân hàng nhận tiền');
    } catch {
      toast.error('Không thể lưu tài khoản ngân hàng.');
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    if (!district.trim() || !city.trim()) { toast.error('Nhập đầy đủ quận/huyện và thành phố'); return; }
    setSaving(true);
    try {
      await http.patch('/users/me', { addressStreet: street, addressWard: ward, addressDistrict: district, addressCity: city });
      toast.success('Đã cập nhật địa chỉ lấy hàng');
    } catch {
      toast.error('Không thể lưu địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  const name = user?.username || 'Người dùng';
  const selectedBank = BANKS.find((b) => b.code === bankCode) ?? BANKS[0];

  // VietQR preview URL
  const vietqrPreview = accountNo.trim() && accountName.trim()
    ? `https://img.vietqr.io/image/${bankCode}-${accountNo.trim()}-compact2.png?accountName=${encodeURIComponent(accountName.toUpperCase().trim())}&addInfo=TrustPass+Payout`
    : null;

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profile',  label: 'Thông tin cá nhân',           icon: User },
    { id: 'bank',     label: 'Tài khoản ngân hàng (VietQR)', icon: Building2 },
    { id: 'address',  label: 'Địa chỉ lấy hàng',            icon: MapPin },
    { id: 'security', label: 'Bảo mật &amp; Phiên đăng nhập',   icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Hồ sơ, ngân hàng nhận tiền &amp; địa chỉ lấy hàng</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="w-full lg:w-52 shrink-0 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={clsx(
                'w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition text-left',
                activeSection === id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <Icon className={clsx('h-4 w-4 shrink-0', activeSection === id ? 'text-emerald-400' : 'text-neutral-400')} />
              <span dangerouslySetInnerHTML={{ __html: label }} />
              <ChevronRight className={clsx('ml-auto h-3 w-3 transition', activeSection === id ? 'text-neutral-400' : 'text-neutral-300')} />
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── PROFILE ── */}
          {activeSection === 'profile' && (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-5">
              <h2 className="font-bold text-neutral-900">Thông tin cá nhân</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-neutral-900 text-white text-xl font-bold shadow-md">
                    {user?.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={name} fill className="object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 border-2 border-white text-white">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900">{name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span className="text-[11px] text-emerald-700 font-semibold">Tài khoản đã xác minh OTP</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName ?? user?.username ?? ''}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className={`${INPUT_CLS} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLS}>
                    Số điện thoại
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Đã xác minh
                    </span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={user?.phone || ''}
                      readOnly
                      className={`${INPUT_CLS} pl-10 bg-neutral-100 cursor-not-allowed text-neutral-500`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Địa chỉ email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email ?? user?.email ?? ''}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className={`${INPUT_CLS} pl-10`}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white transition shadow-md active:scale-[0.98] disabled:opacity-40"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu thay đổi
              </button>
            </div>
          )}

          {/* ── BANK ── */}
          {activeSection === 'bank' && (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-5">
              <div>
                <h2 className="font-bold text-neutral-900">Tài khoản ngân hàng nhận tiền</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Tiền ký quỹ sẽ được chuyển về tài khoản này sau khi đơn hàng hoàn tất.
                </p>
              </div>

              {/* Bank selector */}
              <div>
                <label className={LABEL_CLS}>Chọn ngân hàng</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BANKS.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => setBankCode(b.code)}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-xl border p-3 text-left transition',
                        bankCode === b.code
                          ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
                      )}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: b.color }}
                      >
                        {b.code.slice(0, 3)}
                      </span>
                      <span className="text-xs font-semibold text-neutral-800 leading-snug">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>
                    <CreditCard className="inline h-3.5 w-3.5 mr-1 text-neutral-400" />
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234567890"
                    className={`${INPUT_CLS} font-mono`}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Tên chủ tài khoản</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    className={`${INPUT_CLS} font-mono uppercase`}
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">Nhập đúng tên in trên thẻ ngân hàng (IN HOA)</p>
                </div>
              </div>

              {/* VietQR Preview */}
              {vietqrPreview && (
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                  <div className="flex flex-col items-center gap-2">
                    <Image
                      src={vietqrPreview}
                      alt="VietQR Preview"
                      width={120}
                      height={140}
                      className="rounded-xl border border-white shadow-md"
                      unoptimized
                    />
                    <span className="text-[10px] font-semibold text-emerald-700">VietQR Xem trước</span>
                  </div>
                  <div className="text-xs text-emerald-800 space-y-1.5">
                    <div className="font-bold text-sm text-emerald-900">{selectedBank.name}</div>
                    <div><span className="text-emerald-600">STK:</span> <strong className="font-mono">{accountNo}</strong></div>
                    <div><span className="text-emerald-600">Chủ TK:</span> <strong>{accountName.toUpperCase()}</strong></div>
                    <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-emerald-200/60">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                      <span>Mã QR này sẽ nhận tiền khi đơn hàng ký quỹ hoàn tất.</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={saveBank}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white transition shadow-md active:scale-[0.98] disabled:opacity-40"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu tài khoản ngân hàng
              </button>
            </div>
          )}

          {/* ── ADDRESS ── */}
          {activeSection === 'address' && (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-5">
              <div>
                <h2 className="font-bold text-neutral-900">Địa chỉ lấy hàng mặc định</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Dùng khi phát sinh đơn giao hàng qua GHN / J&T. Không chia sẻ công khai.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Số nhà, tên đường</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="VD: 123 Nguyễn Huệ"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Phường / Xã</label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="VD: Phường Bến Nghé"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Quận / Huyện</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="VD: Quận 1"
                    className={INPUT_CLS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Tỉnh / Thành phố</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className={clsx(
                          'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                          city === c
                            ? 'bg-neutral-900 text-white'
                            : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tỉnh / Thành phố"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <button
                onClick={saveAddress}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white transition shadow-md active:scale-[0.98] disabled:opacity-40"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu địa chỉ lấy hàng
              </button>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-4">
                <h2 className="font-bold text-neutral-900">Bảo mật &amp; Phiên đăng nhập</h2>

                {/* Wallet */}
                {(user?.wallet || user?.wallet_address) && (
                  <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-700">Ví Solana được liên kết</p>
                      <p className="text-[11px] font-mono text-neutral-500 mt-0.5 break-all">
                        {user?.wallet || user?.wallet_address}
                      </p>
                    </div>
                  </div>
                )}

                {/* Active session */}
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-neutral-700">Phiên đăng nhập hiện tại</p>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Đang hoạt động
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 space-y-0.5">
                    <p>Thiết bị: Trình duyệt Web</p>
                    <p>Địa điểm: Việt Nam</p>
                    <p>Phiên này: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="rounded-3xl border border-rose-200/80 bg-white p-6 shadow-xs">
                <h3 className="font-bold text-neutral-900 mb-1">Đăng xuất tài khoản</h3>
                <p className="text-xs text-neutral-500 mb-4">Xóa phiên đăng nhập trên thiết bị này.</p>
                <button
                  onClick={() => {
                    performFullLogout(queryClient);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-5 py-2.5 text-sm font-bold text-rose-700 transition active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất thiết bị này
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

