'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, X, Bell, Heart, Plus, ChevronDown, MapPin,
  ShieldCheck, Gavel, MessageCircle, ShoppingBag, Menu,
  ArrowLeft, Sparkles, Shirt, Smartphone, Footprints,
  Camera, Watch, BookOpen, Dumbbell,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';
import type { ListingCategory } from '@/types/listing';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon?: React.FC<{ className?: string }>;
  badge?: boolean;
  special?: boolean;
}

interface CategoryItem {
  label: string;
  value: ListingCategory | 'ALL';
  Icon: React.FC<{ className?: string }>;
}

interface RadiusOption {
  label: string;
  value: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Khám phá',  href: '/' },
  { label: 'Tin nhắn',  href: '/chat',          icon: MessageCircle, badge: true },
  { label: 'Đơn hàng',  href: '/orders',         icon: ShoppingBag },
  { label: 'Trọng tài', href: '/admin/disputes', icon: Gavel, special: true },
];

const CATEGORIES: CategoryItem[] = [
  { label: 'Tất cả',    value: 'ALL',         Icon: Sparkles },
  { label: 'Thời trang', value: 'FASHION',    Icon: Shirt },
  { label: 'Điện tử',  value: 'ELECTRONICS', Icon: Smartphone },
  { label: 'Sneaker',  value: 'SNEAKERS',    Icon: Footprints },
  { label: 'Máy ảnh',  value: 'CAMERA',      Icon: Camera },
  { label: 'Phụ kiện', value: 'ACCESSORIES', Icon: Watch },
  { label: 'Sách',     value: 'BOOKS',       Icon: BookOpen },
  { label: 'Thể thao', value: 'SPORTS',      Icon: Dumbbell },
];

const RADII: RadiusOption[] = [
  { label: 'Mọi nơi', value: 0 },
  { label: '< 5km',   value: 5 },
  { label: '< 10km',  value: 10 },
  { label: '< 20km',  value: 20 },
];

// ─── SearchBar ────────────────────────────────────────────────────────────────

function SearchBar({
  className,
  autoFocus,
  onClose,
}: {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = val.trim();
    if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); onClose?.(); }
  };

  return (
    <form onSubmit={submit} className={clsx('relative', className)}>
      {/* Search icon — absolute left */}
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

      <input
        ref={ref}
        type="search"
        autoFocus={autoFocus}
        placeholder="Tìm áo khoác vintage, sneaker, máy ảnh..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          'h-9 w-full rounded-full border py-2 pl-9 pr-10 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-all duration-200',
          focused
            ? 'border-neutral-300 bg-white ring-2 ring-neutral-900/5 shadow-sm'
            : 'border-transparent bg-neutral-100/80 hover:bg-neutral-100',
        )}
      />

      {/* Right slot: clear or kbd */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {val ? (
          <button
            type="button"
            onClick={() => { setVal(''); ref.current?.focus(); }}
            className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300 text-white transition hover:bg-neutral-400"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : (
          <kbd className="hidden items-center rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 shadow-xs sm:flex">
            ⌘K
          </kbd>
        )}
      </div>
    </form>
  );
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────

function UserMenu() {
  const { username, avatarUrl } = useAuthStore();
  const [open, setOpen] = useState(false);
  const name = username ?? 'Tài khoản';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2.5 text-sm font-medium text-neutral-700 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none"
      >
        {/* Avatar 32px */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-xs font-bold text-white">
          {avatarUrl
            ? <Image src={avatarUrl} alt={name} width={32} height={32} className="object-cover" />
            : name.charAt(0).toUpperCase()}
        </span>

        <div className="hidden flex-col items-start sm:flex">
          <span className="max-w-[80px] truncate text-[13px] font-semibold text-neutral-800 leading-tight">
            {name}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-neutral-400 leading-tight">
            <span className="text-amber-400">★</span> 5.0
          </span>
        </div>

        <ChevronDown className={clsx(
          'hidden h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 sm:block',
          open && 'rotate-180',
        )} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-52 origin-top-right animate-slide-up overflow-hidden rounded-2xl border border-neutral-100 bg-white py-1.5 shadow-xl shadow-neutral-900/10">
            {([
              ['Hồ sơ của tôi', '/profile'],
              ['Đơn hàng',      '/orders'],
              ['Tin đã đăng',   '/sell'],
              ['Yêu thích',     '/profile/wishlist'],
            ] as [string, string][]).map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900">
                {label}
              </Link>
            ))}
            <div className="my-1 border-t border-neutral-100" />
            <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50">
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PublicNavbar ─────────────────────────────────────────────────────────────

interface PublicNavbarProps {
  activeCategory?: ListingCategory | 'ALL';
  activeRadius?: number;
  onCategoryChange?: (c: ListingCategory | 'ALL') => void;
  onRadiusChange?: (km: number) => void;
  showCategoryBar?: boolean;
}

export default function PublicNavbar({
  activeCategory: extCat,
  activeRadius: extRadius,
  onCategoryChange,
  onRadiusChange,
  showCategoryBar = true,
}: PublicNavbarProps) {
  const pathname = usePathname();

  const [localCat, setLocalCat]       = useState<ListingCategory | 'ALL'>('ALL');
  const [localRadius, setLocalRadius] = useState(0);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileMenu, setMobileMenu]   = useState(false);

  const activeCat    = extCat    ?? localCat;
  const activeRadius = extRadius ?? localRadius;

  const handleCat = useCallback((c: ListingCategory | 'ALL') => {
    setLocalCat(c); onCategoryChange?.(c);
  }, [onCategoryChange]);

  const handleRadius = useCallback((km: number) => {
    setLocalRadius(km); onRadiusChange?.(km);
  }, [onRadiusChange]);

  // ── LAYER 1: Main Header ──────────────────────────────────────────────────

  return (
    <div className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">

      {/* ═════════════ TIER 1 — main header h-16 ═════════════ */}
      <div className="h-16 border-b border-neutral-100">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* ── LEFT: Brand ── */}
          {!mobileSearch && (
            <div className="flex shrink-0 items-center gap-3">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-neutral-900">
                  Chợ Ký Quỹ
                </span>
                <span className="flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3 stroke-[2]" />
                  Ký quỹ 48h
                </span>
              </Link>

              {/* Location divider + dropdown */}
              <button className="hidden items-center gap-1 border-l border-neutral-200 pl-3 text-xs text-neutral-500 transition hover:text-neutral-900 lg:flex">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>TP. Hồ Chí Minh</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* ── CENTER: Search (desktop always, mobile toggle) ── */}
          {!mobileSearch ? (
            <div className="hidden flex-1 justify-center md:flex">
              <SearchBar className="w-full max-w-md" />
            </div>
          ) : (
            /* Mobile full-width search */
            <div className="flex flex-1 items-center gap-2">
              <button
                onClick={() => setMobileSearch(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <SearchBar className="flex-1" autoFocus onClose={() => setMobileSearch(false)} />
            </div>
          )}

          {/* ── RIGHT: Nav + Actions ── */}
          {!mobileSearch && (
            <div className="ml-auto flex shrink-0 items-center gap-3">

              {/* Desktop nav links */}
              <nav className="hidden items-center gap-1 xl:flex">
                {NAV_ITEMS.map(({ label, href, icon: Icon, badge, special }) => {
                  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={clsx(
                        'relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                        active   ? 'font-semibold text-neutral-900'
                        : special ? 'text-neutral-600 hover:text-neutral-900'
                        :           'text-neutral-500 hover:text-neutral-900',
                      )}
                    >
                      {Icon && (
                        <Icon className={clsx(
                          'h-3.5 w-3.5',
                          special ? 'text-neutral-400' : 'text-neutral-400',
                        )} />
                      )}
                      {label}
                      {/* Unread dot — tiny, does not obscure icon */}
                      {badge && (
                        <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-white" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Divider */}
              <span className="hidden h-5 w-px bg-neutral-200 xl:block" />

              {/* Wishlist */}
              <Link href="/profile/wishlist" aria-label="Yêu thích"
                className="hidden h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 sm:flex">
                <Heart className="h-5 w-5" />
              </Link>

              {/* Notifications — dot badge only, never covers icon */}
              <button aria-label="Thông báo"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100">
                <Bell className="h-5 w-5" />
                {/* 6px dot badge — top-right corner of icon, ring isolates it */}
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1.5 ring-white" />
              </button>

              {/* User profile */}
              <UserMenu />

              {/* CTA */}
              <Link href="/sell"
                className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 active:scale-95">
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Đăng tin</span>
              </Link>

              {/* Mobile search icon */}
              <button onClick={() => setMobileSearch(true)} aria-label="Tìm kiếm"
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 md:hidden">
                <Search className="h-5 w-5" />
              </button>

              {/* Hamburger — below xl */}
              <button onClick={() => setMobileMenu((p) => !p)} aria-label="Menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 xl:hidden">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenu && !mobileSearch && (
        <>
          <div className="fixed inset-0 z-10 bg-black/10" onClick={() => setMobileMenu(false)} />
          <div className="absolute inset-x-0 top-full z-20 animate-slide-up border-t border-neutral-100 bg-white px-4 pb-4 pt-2 shadow-xl xl:hidden">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ label, href, icon: Icon, badge, special }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} onClick={() => setMobileMenu(false)}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      active   ? 'bg-neutral-100 font-semibold text-neutral-900'
                      : special ? 'text-neutral-700 hover:bg-neutral-50'
                      :           'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                    )}>
                    {Icon && <Icon className="h-4 w-4 text-neutral-400" />}
                    <span className="flex-1">{label}</span>
                    {badge && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* ═════════════ TIER 2 — category bar h-12 ═════════════ */}
      {showCategoryBar && (
        <div className="h-12 bg-white">
          <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">

            {/* Category pills — scrollable, hidden scrollbar */}
            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map(({ label, value, Icon }) => {
                const active = activeCat === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleCat(value)}
                    className={clsx(
                      'flex shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150',
                      active
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-transparent text-neutral-600 hover:bg-neutral-100',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Distance segmented control — right side */}
            <div className="ml-3 hidden shrink-0 items-center divide-x divide-neutral-200 rounded-lg border border-neutral-200 bg-neutral-50 sm:flex">
              {RADII.map(({ label, value }, i) => (
                <button
                  key={value}
                  onClick={() => handleRadius(value)}
                  className={clsx(
                    'h-8 px-3 text-[11px] font-medium transition-colors',
                    i === 0 && 'rounded-l-lg',
                    i === RADII.length - 1 && 'rounded-r-lg',
                    activeRadius === value
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile radius row */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-neutral-50 px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden">
            {RADII.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleRadius(value)}
                className={clsx(
                  'shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                  activeRadius === value
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
