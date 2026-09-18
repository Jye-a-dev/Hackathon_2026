'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Layers,
  Scale,
  Activity,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useCurrentUser } from '@/hooks/useMarketplace';
import { useAuthStore } from '@/store/useAuthStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: '/admin/escrow',
    label: 'Quản lý cược & Ký quỹ',
    icon: Layers,
    description: 'Vault PDAs & Live Escrows',
  },
  {
    href: '/admin/disputes',
    label: 'Trung tâm Trọng tài',
    icon: Scale,
    description: 'Xử lý khiếu nại & Bằng chứng',
  },
  {
    href: '/admin/logs',
    label: 'Nhật ký Webhook & GD',
    icon: Activity,
    description: 'VietQR, GHN, J&T Webhooks',
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { logout } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ARBITER';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col lg:flex-row antialiased">
      {/* ── Top Mobile Bar (lg:hidden) ── */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">TrustPass Admin Console</span>
          </div>
        </div>

        <Link
          href="/"
          className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 font-medium"
        >
          <span>Về sàn</span>
          <ArrowLeft className="h-3 w-3 rotate-180" />
        </Link>
      </header>

      {/* ── Persistent Desktop Sidebar & Mobile Drawer ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-neutral-900 text-neutral-300 border-r border-neutral-800 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:min-h-screen',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Top brand & navigation */}
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <Link href="/admin/escrow" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 shadow-inner">
                <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white tracking-tight">TrustPass</div>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Admin Console
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Quản trị hệ thống
            </div>

            {NAV_ITEMS.map(({ href, label, icon: Icon, description }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={clsx(
                    'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all text-xs font-medium',
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200',
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4 w-4 shrink-0 mt-0.5 transition-colors',
                      active ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-300',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{label}</div>
                    <div className="text-[10px] text-neutral-500 font-normal truncate">
                      {description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User / Arbiter Info */}
        <div className="p-4 border-t border-neutral-800/80 space-y-3 bg-neutral-900/50">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {user?.username || 'Trọng tài viên'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <Lock className="h-2.5 w-2.5" />
                <span>{user?.role || 'ARBITER'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Về sàn P2P</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {!userLoading && user && !isAdmin && (
          <div className="m-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-3 text-xs">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-bold">Cảnh báo phân quyền: </span>
              Tài khoản của bạn hiện là &apos;{user.role}&apos;. Chỉ tài khoản ADMIN hoặc ARBITER mới có quyền thực thi lệnh trọng tài on-chain.
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
