'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { icon: Home,          label: 'Khám phá',  href: '/' },
  { icon: Search,        label: 'Tìm kiếm',  href: '/search' },
  { icon: Plus,          label: 'Đăng tin',  href: '/sell',  isSell: true },
  { icon: MessageCircle, label: 'Tin nhắn',  href: '/chat' },
  { icon: User,          label: 'Cá nhân',   href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav md:hidden" aria-label="Thanh điều hướng chính">
      <div className="flex items-end justify-around pt-2 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, href, isSell }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          if (isSell) {
            return (
              <Link
                key={href}
                href={href}
                aria-label="Đăng tin bán đồ"
                className="flex flex-col items-center -mt-5"
              >
                <span className="gradient-sell-btn flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95">
                  <Plus className="h-7 w-7 text-white stroke-[2.5]" />
                </span>
                <span className="mt-1 text-[10px] font-semibold text-emerald-600">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 pb-1 pt-0.5 transition-all',
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Icon className={clsx('h-6 w-6', isActive && 'stroke-[2.5]')} />
              <span className={clsx('text-[10px] font-medium', isActive && 'font-semibold')}>
                {label}
              </span>
              {isActive && (
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
