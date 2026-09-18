'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  Eye,
  MoreHorizontal,
  Edit3,
  EyeOff,
  CheckSquare,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { useListings, useCurrentUser } from '@/hooks/useMarketplace';
import { listingsApi } from '@/libs/api';
import type { Listing, ListingStatus } from '@/types/listing';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

type StatusFilter = 'ALL' | ListingStatus;

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL',      label: 'Tất cả' },
  { id: 'ACTIVE',   label: 'Đang bán' },
  { id: 'RESERVED', label: 'Đang đặt cọc' },
  { id: 'SOLD',     label: 'Đã bán' },
  { id: 'INACTIVE', label: 'Đã ẩn' },
];

const STATUS_BADGE: Record<ListingStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Đang mở bán',             cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  AVAILABLE: { label: 'Đang mở bán',             cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  RESERVED:  { label: 'Đang có giao dịch ký quỹ', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  SOLD:      { label: 'Đã bán',                  cls: 'bg-neutral-100 text-neutral-500' },
  INACTIVE:  { label: 'Đã ẩn',                   cls: 'bg-neutral-100 text-neutral-400' },
};

function ContextMenu({
  listing,
  onClose,
  onRefresh,
}: {
  listing: Listing;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const act = async (status: string) => {
    setLoading(true);
    try {
      await listingsApi.updateStatus(listing.id, status);
      toast.success('Đã cập nhật trạng thái tin đăng');
      onRefresh();
      onClose();
    } catch {
      toast.error('Không thể cập nhật. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-0 top-8 z-20 w-44 rounded-2xl border border-neutral-200 bg-white shadow-xl py-1.5 overflow-hidden">
      <Link
        href={`/listings/${listing.id}/edit`}
        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
        onClick={onClose}
      >
        <Edit3 className="h-3.5 w-3.5 text-neutral-400" />
        Sửa tin
      </Link>
      {(listing.status === 'ACTIVE' || (listing.status as string) === 'AVAILABLE') && (
        <button
          disabled={loading}
          onClick={() => act('INACTIVE')}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
        >
          <EyeOff className="h-3.5 w-3.5 text-neutral-400" />
          Ẩn tin
        </button>
      )}
      {listing.status === 'INACTIVE' && (
        <button
          disabled={loading}
          onClick={() => act('ACTIVE')}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
        >
          <Eye className="h-3.5 w-3.5 text-neutral-400" />
          Hiện tin
        </button>
      )}
      {listing.status !== 'SOLD' && (
        <button
          disabled={loading}
          onClick={() => act('SOLD')}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
        >
          <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
          Đánh dấu đã bán
        </button>
      )}
      <div className="my-1 border-t border-neutral-100" />
      <button
        disabled={loading}
        onClick={() => act('INACTIVE')}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Xóa tin
      </button>
    </div>
  );
}

function ListingCard({ listing, onRefresh }: { listing: Listing; onRefresh: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const badge = STATUS_BADGE[listing.status] ?? STATUS_BADGE.ACTIVE;
  const thumb = listing.images?.[0];

  return (
    <div className="group relative flex flex-col rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md transition">
      {/* Image */}
      <div className="relative aspect-4/5 bg-neutral-100 overflow-hidden">
        {thumb ? (
          <Image src={thumb} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-neutral-300" />
          </div>
        )}

        {/* Status badge */}
        <span className={clsx('absolute top-2 left-2 rounded-lg px-1.5 py-0.5 text-[9px] font-bold', badge.cls)}>
          {badge.label}
        </span>

        {/* Context menu button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 border border-neutral-200 shadow-xs text-neutral-600 hover:bg-white transition"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <ContextMenu listing={listing} onClose={() => setMenuOpen(false)} onRefresh={onRefresh} />
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-neutral-800 line-clamp-2 leading-snug">{listing.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-neutral-900">{fmt(listing.price)}</span>
          {(listing.viewCount ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
              <Eye className="h-3 w-3" />
              {listing.viewCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserListingsPage() {
  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: pages, isLoading, refetch } = useListings(
    statusFilter === 'ALL' ? {} : { status: statusFilter as ListingStatus },
  );

  const allListings = useMemo(() => {
    const raw = pages?.pages.flatMap((p) => p.data) ?? [];
    // Filter by seller
    const mine = user?.wallet
      ? raw.filter((l) => l.seller.id === user.id || l.seller.id === user.wallet)
      : raw;
    // Search filter
    if (!searchQuery.trim()) return mine;
    const q = searchQuery.toLowerCase();
    return mine.filter((l) => l.title.toLowerCase().includes(q));
  }, [pages, user, searchQuery]);

  const tabCount = (id: StatusFilter) => {
    const all = pages?.pages.flatMap((p) => p.data) ?? [];
    const mine = user?.wallet ? all.filter((l) => l.seller.id === user.id || l.seller.id === user.wallet) : all;
    if (id === 'ALL') return mine.length;
    return mine.filter((l) =>
      id === 'ACTIVE'
        ? l.status === 'ACTIVE' || (l.status as string) === 'AVAILABLE'
        : l.status === id,
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            Tin đăng của tôi
            {!isLoading && (
              <span className="rounded-xl bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600">
                {allListings.length}
              </span>
            )}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">Quản lý tất cả tin đăng bán của bạn</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition shadow-xs">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <Link
            href="/sell"
            className="flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-white transition shadow-md active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Đăng tin mới
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tin đăng..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex overflow-x-auto [scrollbar-width:none] gap-1 bg-neutral-100 rounded-2xl p-1">
        {STATUS_TABS.map(({ id, label }) => {
          const count = tabCount(id);
          return (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={clsx(
                'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition shrink-0',
                statusFilter === id
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900',
              )}
            >
              {label}
              {count > 0 && (
                <span className={clsx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', statusFilter === id ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600')}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-neutral-100 animate-pulse aspect-3/4" />
          ))}
        </div>
      ) : allListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100">
            <Package className="h-8 w-8 text-neutral-400" />
          </div>
          <div>
            <p className="font-bold text-neutral-700">Bạn chưa có tin đăng nào</p>
            <p className="text-xs text-neutral-400 mt-1.5 max-w-xs">
              {searchQuery ? 'Không tìm thấy tin đăng phù hợp. Thử từ khóa khác.' : 'Bắt đầu đăng bán sản phẩm và được bảo vệ bởi Ký quỹ 48h.'}
            </p>
          </div>
          {!searchQuery && (
            <Link
              href="/sell"
              className="flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white transition shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Đăng tin đầu tiên
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onRefresh={refetch} />
          ))}
        </div>
      )}

      {/* Escrow badge */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 justify-center pt-2">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>Tất cả tin đăng được bảo vệ bởi Ký quỹ 48h tự động</span>
      </div>
    </div>
  );
}

