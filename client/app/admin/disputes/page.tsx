'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Scale, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, MessageSquare, RefreshCw, Package, ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatVND } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';
import { useDisputes, useResolveDispute, useCurrentUser } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useState } from 'react';
import type { Dispute } from '@/types/dispute';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN:            { label: 'Đang mở',     color: 'bg-amber-100 text-amber-800' },
  UNDER_REVIEW:    { label: 'Đang xét',    color: 'bg-blue-100 text-blue-800' },
  RESOLVED_BUYER:  { label: 'Hoàn tiền',   color: 'bg-purple-100 text-purple-800' },
  RESOLVED_SELLER: { label: 'Giải ngân',   color: 'bg-emerald-100 text-emerald-800' },
};

// ─── Dispute list skeleton ────────────────────────────────────────────────────

function DisputeListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-2xl border border-neutral-100 bg-white p-4 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // ── Role guard — must be ADMIN or ARBITER ────────────────────────────────
  const { data: user, isLoading: userLoading } = useCurrentUser();
  useEffect(() => {
    if (!userLoading && user && user.role !== 'ADMIN' && user.role !== 'ARBITER') {
      toast.error('Bạn không có quyền truy cập trang này.');
      router.replace('/');
    }
  }, [user, userLoading, router]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    data: disputes,
    isLoading,
    isError,
    error,
    refetch,
  } = useDisputes();

  const { mutate: resolve, isPending: isResolving } = useResolveDispute();

  // Auto-select first dispute
  useEffect(() => {
    if (disputes && disputes.length > 0 && !selectedId) {
      setSelectedId(disputes[0].id);
    }
  }, [disputes, selectedId]);

  // Show Sonner on fetch error
  useEffect(() => {
    if (isError && error) {
      const msg = (error as any)?.response?.data?.message ?? (error as Error)?.message ?? 'Không thể tải danh sách tranh chấp';
      toast.error(msg);
    }
  }, [isError, error]);

  const selectedDispute = disputes?.find((d) => d.id === selectedId) ?? null;

  const handleRuling = (decision: 'ReleaseToSeller' | 'RefundToBuyer') => {
    if (!selectedDispute) return;
    resolve({
      id: selectedDispute.id,
      decision,
      notes: resolutionNote || undefined,
    }, {
      onSuccess: () => {
        setResolutionNote('');
        setSelectedId(null);
      },
    });
  };

  // ── Loading / access check ────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Scale className="h-8 w-8 animate-pulse text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
        <button
          onClick={() => router.push('/')}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-neutral-700" />
          <h1 className="text-base font-bold text-neutral-900">Cổng Trọng Tài Phân Xử</h1>
        </div>
        {user && (
          <span className="ml-auto rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            {user.role}
          </span>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4 sm:p-6">

        {/* ── LEFT: Dispute list ── */}
        <aside className="w-full max-w-sm shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-700">
              Tranh chấp đang mở
              {disputes && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length}
                </span>
              )}
            </h2>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>

          {isLoading && <DisputeListSkeleton />}

          {isError && !isLoading && (
            <div className="rounded-2xl border border-red-100 bg-white p-4 text-center text-sm text-red-600">
              <p>Không thể tải tranh chấp</p>
              <button onClick={() => refetch()} className="mt-2 text-xs underline">Thử lại</button>
            </div>
          )}

          {!isLoading && !isError && (!disputes || disputes.length === 0) && (
            <EmptyState
              icon={Package}
              title="Không có tranh chấp"
              description="Tất cả tranh chấp đã được giải quyết."
              className="mt-4"
            />
          )}

          {!isLoading && !isError && disputes && disputes.map((d: Dispute) => {
            const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.OPEN;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`w-full rounded-2xl border p-4 text-left transition hover:shadow-md ${
                  selectedId === d.id
                    ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                    : 'border-neutral-100 bg-white'
                }`}
              >
                <div className="flex gap-3">
                  {d.listingImage ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                      <Image src={d.listingImage} alt={d.listingTitle} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100">
                      <Package className="h-6 w-6 text-neutral-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-800">{d.listingTitle}</p>
                    <p className="mt-0.5 text-xs font-semibold text-red-600">{formatVND(d.amountVnd)}</p>
                    <p className="mt-0.5 truncate text-[10px] text-neutral-400">{timeAgo(d.createdAt)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── RIGHT: Detail & ruling ── */}
        <section className="flex-1 space-y-5">
          {!selectedDispute ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white text-neutral-400">
              <div className="text-center">
                <Scale className="mx-auto h-10 w-10 mb-2" />
                <p className="text-sm">Chọn một tranh chấp để xem chi tiết</p>
              </div>
            </div>
          ) : (
            <>
              {/* Dispute detail */}
              <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">{selectedDispute.listingTitle}</h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Mã đơn: <span className="font-mono font-semibold">#{selectedDispute.orderId.slice(-8)}</span>
                      {' · '}
                      {timeAgo(selectedDispute.createdAt)}
                    </p>
                  </div>
                  <span className="text-xl font-black text-red-600">{formatVND(selectedDispute.amountVnd)}</span>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-neutral-50 p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Người mua</p>
                    <p className="mt-1 truncate font-mono text-xs text-neutral-700">{selectedDispute.buyerWallet}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Người bán</p>
                    <p className="mt-1 truncate font-mono text-xs text-neutral-700">{selectedDispute.sellerWallet}</p>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <p className="mb-2 text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Lý do khiếu nại
                  </p>
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-neutral-800 border border-amber-100">
                    {selectedDispute.reason || 'Không có lý do cụ thể'}
                  </p>
                </div>

                {/* Evidence */}
                {selectedDispute.evidenceUrls.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold text-neutral-700">Bằng chứng ({selectedDispute.evidenceUrls.length} file)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedDispute.evidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer"
                          className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 hover:opacity-90 transition">
                          <Image src={url} alt={`Bằng chứng ${i + 1}`} fill className="object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat history */}
                {selectedDispute.chatHistory && selectedDispute.chatHistory.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Lịch sử trò chuyện liên quan
                    </p>
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-2 max-h-40 overflow-y-auto">
                      {selectedDispute.chatHistory.map((msg, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-semibold text-neutral-600">{msg.sender}:</span>{' '}
                          <span className="text-neutral-700">{msg.content}</span>
                          <span className="ml-2 text-neutral-400">{msg.createdAt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ruling panel */}
              {(selectedDispute.status === 'OPEN' || selectedDispute.status === 'UNDER_REVIEW') && (
                <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-neutral-800">Phán quyết Trọng tài</h4>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-neutral-600">
                      Ghi chú phán quyết (không bắt buộc)
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Lý do quyết định, nhận xét về bằng chứng..."
                      className="w-full rounded-xl border border-neutral-200 p-3 text-xs focus:border-neutral-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRuling('RefundToBuyer')}
                      disabled={isResolving}
                      className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Hoàn tiền Người mua
                    </button>
                    <button
                      onClick={() => handleRuling('ReleaseToSeller')}
                      disabled={isResolving}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Giải ngân Người bán
                    </button>
                  </div>

                  {isResolving && (
                    <p className="text-center text-xs text-neutral-400 animate-pulse">Đang xử lý phán quyết...</p>
                  )}
                </div>
              )}

              {/* Resolved state */}
              {(selectedDispute.status === 'RESOLVED_BUYER' || selectedDispute.status === 'RESOLVED_SELLER') && (
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-center">
                  <ShieldOff className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                  <p className="text-sm font-bold text-neutral-700">Tranh chấp đã được giải quyết</p>
                  {selectedDispute.resolutionNote && (
                    <p className="mt-1 text-xs text-neutral-500">{selectedDispute.resolutionNote}</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
