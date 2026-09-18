'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  MapPin,
  ChevronDown,
  Plus,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';

interface HeaderProps {
  showLocation?: boolean;
  title?: string;
}

const DESKTOP_NAV = [
  { label: 'Khám phá', href: '/' },
  { label: 'Tin nhắn', href: '/chat' },
  { label: 'Đơn hàng', href: '/orders' },
  { label: 'Trọng tài', href: '/admin/disputes' },
];

export default function Header({ showLocation = true, title }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.username ?? 'Tài khoản';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) router.push(`/?search=${encodeURIComponent(searchVal)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/85 backdrop-blur-2xl">
      {/* ─── Main nav row ─── */}
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:h-17 sm:gap-5 sm:px-6 lg:px-8">

        {/* Brand */}
      

        {/* ── Desktop nav links ── */}
        <nav className="hidden items-center gap-0.5 xl:flex">
          {DESKTOP_NAV.map(({ label, href }) => {
            const active =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right actions ── */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mobile search */}
          <Link
            href="/search"
            aria-label="Tìm kiếm"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100 md:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          <button
            aria-label="Thông báo"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Orders icon — mobile/mid only */}
          <Link
            href="/orders"
            aria-label="Đơn hàng"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100 xl:hidden"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>

          {/* User avatar pill — desktop */}
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-2 pr-3 text-sm font-medium text-neutral-700 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 sm:flex"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-22.5 truncate">{displayName}</span>
          </Link>

          {/* User icon — mobile */}
          <Link
            href="/profile"
            aria-label="Tài khoản"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100 sm:hidden"
          >
            <User className="h-5 w-5" />
          </Link>

          {/* CTA post listing */}
          <Link
            href="/sell"
            className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Đăng tin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
