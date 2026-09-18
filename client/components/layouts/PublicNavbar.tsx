'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Bell,
  Heart,
  Plus,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Gavel,
  MessageCircle,
  ShoppingBag,
  Menu,
  ArrowLeft,
  Sparkles,
  Shirt,
  Smartphone,
  Footprints,
  Camera,
  Watch,
  Headphones,
  Star,
  LogOut,
  User,
  ShieldAlert,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentUser, useSearchListings } from '@/hooks/useMarketplace';
import { formatVND } from '@/utils/formatCurrency';
import type { ListingCategory } from '@/types/listing';

interface CategoryItem {
  label: string;
  value: ListingCategory | 'ALL';
  Icon: React.FC<{ className?: string }>;
}

const CATEGORIES: CategoryItem[] = [
  { label: 'Tất cả', value: 'ALL', Icon: Sparkles },
  { label: 'Điện tử', value: 'ELECTRONICS', Icon: Smartphone },
  { label: 'Máy ảnh', value: 'CAMERA', Icon: Camera },
  { label: 'Sneakers', value: 'SNEAKERS', Icon: Footprints },
  { label: 'Thời trang', value: 'FASHION', Icon: Shirt },
  { label: 'Phụ kiện', value: 'ACCESSORIES', Icon: Watch },
  { label: 'Âm thanh', value: 'OTHER', Icon: Headphones },
];

const RADII = [
  { label: 'Mọi nơi', value: 0 },
  { label: '< 5km', value: 5 },
  { label: '< 10km', value: 10 },
];

function OmniSearchBar({
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
  const [debouncedVal, setDebouncedVal] = useState('');
  const [focused, setFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVal(val), 250);
    return () => clearTimeout(t);
  }, [val]);

  // Global shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: results, isFetching } = useSearchListings(debouncedVal);
  const showDropdown = focused && val.trim().length >= 2 && !isDismissed;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !ref.current?.contains(e.target as Node)
      ) {
        setIsDismissed(true);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExecuteSearch = () => {
    const q = val.trim();
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
      setIsDismissed(true);
      onClose?.();
    }
  };

  return (
    <div className={clsx('relative w-full max-w-md', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecuteSearch();
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          ref={ref}
          type="search"
          autoFocus={autoFocus}
          placeholder="Tìm iPhone, máy ảnh, sneaker, vintage..."
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setIsDismissed(false);
          }}
          onFocus={() => {
            setFocused(true);
            setIsDismissed(false);
          }}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className={clsx(
            'h-10 w-full rounded-full border border-neutral-200/80 bg-neutral-100/90 py-2 pl-10 pr-14 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-all duration-200 focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-900/5',
          )}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {val ? (
            <button
              type="button"
              onClick={() => {
                setVal('');
                ref.current?.focus();
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300 text-white hover:bg-neutral-400"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          ) : (
            <kbd className="hidden items-center rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 shadow-2xs sm:flex">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      {/* Live Search Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-[320px] overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl shadow-neutral-900/10"
        >
          {isFetching && (
            <div className="flex items-center justify-center py-6 text-xs text-neutral-400">
              <span className="animate-pulse">Đang tìm kiếm...</span>
            </div>
          )}

          {!isFetching && results && results.length === 0 && (
            <div className="px-4 py-5 text-center text-xs text-neutral-400">
              Không tìm thấy sản phẩm cho &quot;{val}&quot;
            </div>
          )}

          {!isFetching && results && results.length > 0 && (
            <ul className="py-1.5">
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/listings/${item.id}`}
                    onClick={() => {
                      setIsDismissed(true);
                      setVal('');
                      onClose?.();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-neutral-50"
                  >
                    {item.images[0] ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-neutral-800">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-bold text-emerald-600">
                        {formatVND(item.price)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleExecuteSearch}
                  className="w-full px-4 py-2.5 text-center text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
                >
                  Xem tất cả kết quả cho &quot;{val}&quot; →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function UserProfilePill() {
  const { logout, isLoggedIn } = useAuthStore();
  const { data: user, isLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs transition hover:bg-neutral-50"
      >
        <User className="h-3.5 w-3.5" />
        <span>Đăng nhập</span>
      </Link>
    );
  }

  const name = user?.username ?? 'Tài khoản';
  const avatar = user?.avatarUrl;
  const rating = user?.rating ?? 5.0;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ARBITER';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-hidden"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-xs font-bold text-white">
          {isLoading ? (
            '…'
          ) : avatar ? (
            <Image src={avatar} alt={name} width={28} height={28} className="object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>

        <div className="hidden flex-col items-start sm:flex text-left">
          <span className="max-w-20 truncate text-xs font-bold text-neutral-800 leading-tight">
            {isLoading ? '…' : name}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-amber-500 leading-tight font-semibold">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        </div>

        <ChevronDown
          className={clsx('hidden h-3 w-3 text-neutral-400 transition-transform sm:block', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-100 bg-white py-1.5 shadow-xl shadow-neutral-900/10">
            {user && (
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="truncate text-xs font-bold text-neutral-900">{name}</p>
                <p className="truncate text-[10px] text-neutral-400">{user.email ?? user.role}</p>
              </div>
            )}

            <div className="py-1">
              <Link
                href="/user/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
              >
                <User className="h-3.5 w-3.5 text-neutral-500" />
                <span>Hồ sơ & Tổng quan</span>
              </Link>

              <Link
                href="/user/orders"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-neutral-500" />
                <span>Đơn mua & Ký quỹ</span>
              </Link>

              <Link
                href="/user/sales"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
              >
                <Sparkles className="h-3.5 w-3.5 text-neutral-500" />
                <span>Đơn bán & Doanh thu</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/escrow"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 border-t border-neutral-100 bg-emerald-50/60 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100/60"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Quản trị cược & Vaults (Admin)</span>
                </Link>
              )}
            </div>

            <div className="my-1 border-t border-neutral-100" />
            <button
              onClick={() => {
                setOpen(false);
                logout();
                router.push('/auth/login');
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export interface PublicNavbarProps {
  activeCategory?: ListingCategory | 'ALL';
  activeRadius?: number;
  onCategoryChange?: (c: ListingCategory | 'ALL') => void;
  onRadiusChange?: (km: number) => void;
  showCategoryBar?: boolean;
}

function PublicNavbarContent({
  activeCategory: extCat,
  activeRadius: extRadius,
  onCategoryChange,
  onRadiusChange,
  showCategoryBar,
}: PublicNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine active category and radius from props or URL
  const queryCat = (searchParams.get('category') as ListingCategory | 'ALL') || 'ALL';
  const queryRadius = Number(searchParams.get('radius') || 0);

  const [localCat, setLocalCat] = useState<ListingCategory | 'ALL'>(extCat ?? queryCat);
  const [localRadius, setLocalRadius] = useState<number>(extRadius ?? queryRadius);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Sync state if URL search params change
  useEffect(() => {
    if (extCat === undefined) setLocalCat(queryCat);
  }, [extCat, queryCat]);

  useEffect(() => {
    if (extRadius === undefined) setLocalRadius(queryRadius);
  }, [extRadius, queryRadius]);

  const activeCat = extCat ?? localCat;
  const activeRadius = extRadius ?? localRadius;

  // Auto show category bar on homepage if not explicitly set
  const isHomePage = pathname === '/';
  const shouldShowCategoryBar = showCategoryBar !== undefined ? showCategoryBar : isHomePage;

  const handleCatSelect = useCallback(
    (c: ListingCategory | 'ALL') => {
      setLocalCat(c);
      onCategoryChange?.(c);
      if (isHomePage) {
        const params = new URLSearchParams(searchParams.toString());
        if (c === 'ALL') {
          params.delete('category');
        } else {
          params.set('category', c);
        }
        router.push(`/?${params.toString()}`);
      } else {
        router.push(c === 'ALL' ? '/' : `/?category=${c}`);
      }
    },
    [onCategoryChange, isHomePage, router, searchParams],
  );

  const handleRadiusSelect = useCallback(
    (km: number) => {
      setLocalRadius(km);
      onRadiusChange?.(km);
      if (isHomePage) {
        const params = new URLSearchParams(searchParams.toString());
        if (km === 0) {
          params.delete('radius');
        } else {
          params.set('radius', String(km));
        }
        router.push(`/?${params.toString()}`);
      }
    },
    [onRadiusChange, isHomePage, router, searchParams],
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-neutral-200/80">
      {/* ── Tier 1: Main Header (h-16) ── */}
      <div className="h-16">
        <div className="flex h-full w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand logo with ShieldCheck, Solana 48h Escrow animated pill, City selector */}
          {!mobileSearch && (
            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-emerald-400 shadow-sm">
                  <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
                </div>
                <span className="text-base font-extrabold tracking-tight text-neutral-950">
                  TrustPass
                </span>
              </Link>

              {/* Solana 48h Escrow animated pill */}
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-[10px] font-bold text-emerald-800 sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>Solana 48h Escrow</span>
              </div>

              {/* City selector dropdown */}
              <button
                type="button"
                className="hidden items-center gap-1 border-l border-neutral-200 pl-2.5 text-xs text-neutral-500 transition hover:text-neutral-800 lg:flex"
              >
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-medium">TP. Hồ Chí Minh</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>
            </div>
          )}

          {/* Center: Omni-Search Bar */}
          {!mobileSearch ? (
            <div className="hidden flex-1 justify-center md:flex px-4 max-w-md mx-auto">
              <OmniSearchBar className="w-full" />
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSearch(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <OmniSearchBar className="flex-1" autoFocus onClose={() => setMobileSearch(false)} />
            </div>
          )}

          {/* Right: Nav Links, CTA, Wishlist, Bell, Profile */}
          {!mobileSearch && (
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
              <nav className="hidden items-center gap-1 lg:flex">
                <Link
                  href="/"
                  className={clsx(
                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                    pathname === '/' ? 'text-neutral-950 font-bold' : 'text-neutral-500 hover:text-neutral-900',
                  )}
                >
                  Khám phá
                </Link>

                <Link
                  href="/chat"
                  className={clsx(
                    'relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
                    pathname.startsWith('/chat') ? 'text-neutral-950 font-bold' : 'text-neutral-500 hover:text-neutral-900',
                  )}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Tin nhắn</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </Link>

                <Link
                  href="/user/orders"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
                    pathname.startsWith('/user/orders') || pathname.startsWith('/orders')
                      ? 'text-neutral-950 font-bold'
                      : 'text-neutral-500 hover:text-neutral-900',
                  )}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Đơn hàng</span>
                </Link>

                <Link
                  href="/admin/disputes"
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
                    pathname.startsWith('/admin') ? 'text-neutral-950 font-bold' : 'text-neutral-500 hover:text-neutral-900',
                  )}
                >
                  <Gavel className="h-3.5 w-3.5" />
                  <span>Trọng tài</span>
                </Link>
              </nav>

              <span className="hidden h-4 w-px bg-neutral-200 lg:block" />

              {/* Wishlist Icon */}
              <Link
                href="/user/orders"
                aria-label="Yêu thích"
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
              >
                <Heart className="h-4 w-4" />
              </Link>

              {/* Notification Bell */}
              <button
                type="button"
                aria-label="Thông báo"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1.5 ring-white" />
              </button>

              {/* + Đăng tin CTA Pill Button */}
              <Link
                href="/sell"
                className="hidden sm:flex items-center gap-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 transition active:scale-95 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Đăng tin</span>
              </Link>

              {/* User Profile Pill */}
              <UserProfilePill />

              {/* Mobile quick search trigger button */}
              <button
                type="button"
                onClick={() => setMobileSearch(true)}
                aria-label="Tìm kiếm"
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 md:hidden"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Mobile hamburger drawer toggle */}
              <button
                type="button"
                onClick={() => setMobileMenu((p) => !p)}
                aria-label="Menu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenu && !mobileSearch && (
        <div className="border-t border-neutral-100 bg-white px-4 py-3 shadow-lg lg:hidden space-y-1">
          <Link
            href="/"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <Sparkles className="h-4 w-4 text-neutral-500" />
            <span>Khám phá</span>
          </Link>
          <Link
            href="/chat"
            onClick={() => setMobileMenu(false)}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-neutral-500" />
              <span>Tin nhắn</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </Link>
          <Link
            href="/user/orders"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <ShoppingBag className="h-4 w-4 text-neutral-500" />
            <span>Đơn hàng ký quỹ</span>
          </Link>
          <Link
            href="/admin/escrow"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <Gavel className="h-4 w-4 text-neutral-500" />
            <span>Cổng Trọng tài & Admin</span>
          </Link>
          <Link
            href="/sell"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Đăng tin bán hàng</span>
          </Link>
        </div>
      )}

      {/* ── Tier 2: Category & Filter Bar (h-12) ── */}
      {shouldShowCategoryBar && (
        <div className="h-12 bg-white/95 border-t border-neutral-100/90">
          <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Horizontal scrollable category pills */}
            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map(({ label, value, Icon }) => {
                const active = activeCat === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleCatSelect(value)}
                    className={clsx(
                      'flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                      active
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Distance segmented control (Desktop/Tablet only) */}
            <div className="ml-3 hidden shrink-0 items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 sm:flex">
              {RADII.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRadiusSelect(value)}
                  className={clsx(
                    'h-7 rounded-md px-3 text-[11px] font-bold transition-all',
                    activeRadius === value
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function PublicNavbar(props: PublicNavbarProps) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-neutral-200/80 h-16" />
      }
    >
      <PublicNavbarContent {...props} />
    </Suspense>
  );
}
