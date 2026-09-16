'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ShoppingBag,
  Heart,
  Scale,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfilePage() {
  const { username, wallet, avatarUrl } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Header title="Tài khoản cá nhân" showLocation={false} />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="relative">
            <Image
              src={avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=MinhTuan'}
              alt={username || 'User'}
              width={64}
              height={64}
              className="rounded-full ring-4 ring-emerald-500/20 bg-slate-100 object-cover"
            />
            <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white text-emerald-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {username || 'Người dùng Ký Quỹ'}
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                Đã xác thực
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400 truncate mt-0.5">
              {wallet ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : 'ID: user_88291'}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="text-amber-600 font-bold">⭐ 4.9 / 5.0</span>
              <span>•</span>
              <span>18 giao dịch thành công</span>
            </div>
          </div>
        </div>

        {/* Escrow Trust Guarantee Summary */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-4 text-white shadow-md shadow-emerald-700/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-emerald-200" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Huy hiệu Ký Quỹ Bảo Vệ 48h
            </h3>
          </div>
          <p className="text-xs text-emerald-50 leading-relaxed">
            Mọi giao dịch mua và bán của bạn đều được bảo đảm 100% tiền trong quỹ an toàn. Không rủi ro quỵt tiền hay bùng hàng.
          </p>
        </div>

        {/* Menu Navigation */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 divide-y divide-slate-100 text-xs">
          <Link
            href="/orders"
            className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-800">Đơn hàng của tôi (Ký quỹ)</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/disputes"
            className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Scale className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-800">Cổng Trọng Tài Admin (Phân xử)</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href="/sell"
            className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-800">Đăng bán món đồ mới</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
