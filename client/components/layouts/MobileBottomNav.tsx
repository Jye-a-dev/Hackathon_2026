'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';

interface NavItem {
  icon: React.FC<{ className?: string }>;
  label: string;
  href: string;
  isCenterCta?: boolean;
  hasBadge?: boolean;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();

  const navItems: NavItem[] = [
    { icon: Home, label: 'Khám phá', href: '/' },
    { icon: Compass, label: 'Tìm kiếm', href: '/search' },
    { icon: Plus, label: 'Đăng tin', href: '/sell', isCenterCta: true },
    { icon: MessageCircle, label: 'Tin nhắn', href: '/chat', hasBadge: true },
    { icon: User, label: 'Tài khoản', href: isLoggedIn ? '/user/orders' : '/auth/login' },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 h-16 bg-white/95 backdrop-blur-lg border-t border-neutral-200/80 flex items-center justify-around px-2 md:hidden"
      aria-label="Thanh điều hướng di động"
    >
      {navItems.map(({ icon: Icon, label, href, isCenterCta, hasBadge }) => {
        const isActive =
          href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);

        if (isCenterCta) {
          return (
            <Link
              key={href}
              href={href}
              aria-label="Đăng tin mới"
              className="flex flex-col items-center -mt-5 group"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-lg shadow-neutral-900/25 transition-transform duration-200 active:scale-90 group-hover:bg-neutral-800">
                <Plus className="h-6 w-6 stroke-[2.5]" />
              </span>
              <span className="mt-1 text-[10px] font-bold text-neutral-800 tracking-tight">
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={clsx(
              'relative flex flex-col items-center justify-center w-14 py-1 transition-colors',
              isActive
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-700 font-medium',
            )}
          >
            <div className="relative">
              <Icon className={clsx('h-5 w-5', isActive && 'stroke-[2.2] text-neutral-900')} />
              {hasBadge && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
            {isActive && (
              <span className="h-1 w-1 rounded-full bg-neutral-900 mt-0.5" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

