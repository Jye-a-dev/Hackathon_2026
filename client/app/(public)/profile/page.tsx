'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ShoppingBag,
  Scale,
  LogOut,
  ChevronRight,
  Sparkles,
  Star,
  Plus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { performFullLogout } from '@/libs/logout';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return (
    <div className="w-full max-w-full pb-24 md:pb-12">
      <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <div className="w-full max-w-xl mx-auto space-y-5">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-neutral-200/80 flex items-center gap-4">
            <div className="relative">
              <Image
                src={user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id ?? 'anon'}`}
                alt={user?.username || 'User'}
                width={64}
                height={64}
                className="rounded-full ring-2 ring-neutral-200 bg-neutral-100 object-cover"
                unoptimized
              />
              <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white text-emerald-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-neutral-950 truncate">
                  {user?.username || 'Người dùng Ký Quỹ'}
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 shrink-0">
                  Đã xác thực
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-500 truncate mt-0.5">
                {user?.email ?? (user?.id ? `ID: ${user.id.slice(0, 8)}...` : 'Chưa đăng nhập')}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
                {user?.rating !== undefined && (
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {user.rating.toFixed(1)} / 5.0
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Escrow Trust Guarantee Summary */}
          <div className="bg-neutral-900 rounded-3xl p-5 text-white shadow-xs border border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Huy hiệu Ký Quỹ Bảo Vệ 48h
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Mọi giao dịch mua và bán của bạn đều được bảo đảm 100% tiền trong quỹ an toàn. Không rủi ro lừa đảo hay giao dịch ảo.
            </p>
          </div>

          {/* Menu Navigation */}
          <div className="bg-white rounded-3xl p-2 shadow-xs border border-neutral-200/80 divide-y divide-neutral-100 text-xs">
            <Link
              href="/user/orders"
              className="flex items-center justify-between p-3.5 hover:bg-neutral-50 rounded-2xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span className="font-bold text-neutral-900">Đơn hàng của tôi (Ký quỹ)</span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </Link>

            <Link
              href="/admin/disputes"
              className="flex items-center justify-between p-3.5 hover:bg-neutral-50 rounded-2xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                  <Scale className="h-4 w-4" />
                </div>
                <span className="font-bold text-neutral-900">Cổng Trọng Tài Admin (Phân xử)</span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </Link>

            <Link
              href="/sell"
              className="flex items-center justify-between p-3.5 hover:bg-neutral-50 rounded-2xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="font-bold text-neutral-900">Đăng bán món đồ mới</span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => performFullLogout(queryClient)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50 rounded-2xl transition text-rose-600"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Đăng xuất tài khoản</span>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-400" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
