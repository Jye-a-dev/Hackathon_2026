'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  ShoppingBag,
  TrendingUp,
  Package,
  Settings,
  Star,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import PublicNavbar from '@/components/layouts/PublicNavbar';
import PublicFooter from '@/components/layouts/PublicFooter';
import MobileBottomNav from '@/components/layouts/MobileBottomNav';
import { useCurrentUser } from '@/hooks/useMarketplace';
import { useAuthStore } from '@/store/useAuthStore';

interface UserLayoutProps {
  children: React.ReactNode;
}

const USER_NAV_ITEMS = [
  {
    href: '/user/dashboard',
    label: 'Tổng quan tài khoản',
    icon: User,
  },
  {
    href: '/user/orders',
    label: 'Đơn mua & Ký quỹ',
    icon: ShoppingBag,
  },
  {
    href: '/user/sales',
    label: 'Đơn bán & Doanh thu',
    icon: TrendingUp,
  },
  {
    href: '/user/listings',
    label: 'Tin đăng của tôi',
    icon: Package,
  },
  {
    href: '/user/settings',
    label: 'Cài đặt & Ngân hàng',
    icon: Settings,
  },
];

export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const { logout, isLoggedIn } = useAuthStore();

  const name = user?.username || 'Người dùng';
  const rating = user?.rating ?? 5.0;

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNavbar showCategoryBar={false} />

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* ── Left Sidebar Sub-panel (Desktop) / Header Card ── */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4">
            {/* User Profile Card */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-sm font-bold text-white shadow-xs">
                  {isLoading ? (
                    '…'
                  ) : user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-sm font-bold text-neutral-900">{name}</h2>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{rating.toFixed(1)} Điểm tín nhiệm</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>Vai trò:</span>
                <span className="font-bold text-neutral-800 uppercase text-[10px] bg-neutral-100 px-2 py-0.5 rounded-md">
                  {user?.role || 'USER'}
                </span>
              </div>
            </div>

            {/* Navigation Tab Bar (Desktop: Vertical List, Mobile: Horizontal Scroll) */}
            <nav className="rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-2xs flex lg:flex-col overflow-x-auto [scrollbar-width:none] gap-1">
              {USER_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/user/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition whitespace-nowrap shrink-0 lg:shrink',
                      active
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                    )}
                  >
                    <Icon className={clsx('h-4 w-4', active ? 'text-emerald-400' : 'text-neutral-400')} />
                    <span>{label}</span>
                  </Link>
                );
              })}

              <div className="hidden lg:block my-1 border-t border-neutral-100" />

              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="hidden lg:flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </nav>
          </aside>

          {/* ── Main Content Console ── */}
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </div>
      </div>

      <PublicFooter />
      <MobileBottomNav />
    </div>
  );
}

