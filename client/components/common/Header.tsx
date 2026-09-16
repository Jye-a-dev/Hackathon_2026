'use client';

import Link from 'next/link';
import { Bell, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';

interface HeaderProps {
  showLocation?: boolean;
  title?: string;
  backHref?: string;
}

export default function Header({ showLocation = true, title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-100">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Left: Logo or title */}
        <div className="flex flex-col">
          {title ? (
            <h1 className="text-base font-bold text-slate-800">{title}</h1>
          ) : (
            <Link href="/" className="flex items-center gap-1.5">
              <span className="gradient-text-primary text-xl font-black tracking-tight">
                Chợ Ký Quỹ
              </span>
            </Link>
          )}
          {showLocation && !title && (
            <button className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
              <MapPin className="h-3 w-3" />
              <span>Hồ Chí Minh</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            aria-label="Đơn hàng của tôi"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-slate-600" />
          </Link>
          <button
            aria-label="Thông báo"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {/* Notification dot */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
