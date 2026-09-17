'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  Package,
} from 'lucide-react';
import { formatVND } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';
import { disputesApi } from '@/libs/api';
import type { Dispute, DisputeStatus } from '@/types/dispute';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await disputesApi.list();
      setDisputes(list);
      if (list.length > 0) {
        setSelectedDispute(list[0]);
      } else {
        setSelectedDispute(null);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải danh sách tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleRuling = async (decision: 'ReleaseToSeller' | 'RefundToBuyer') => {
    if (!selectedDispute) return;
    setIsSubmitting(true);
    try {
      await disputesApi.resolve(selectedDispute.id, {
        decision,
        notes:
          resolutionNote ||
          (decision === 'RefundToBuyer'
            ? 'Chấp thuận hoàn tiền do lỗi sản phẩm'
            : 'Bác bỏ khiếu nại, giải ngân cho người bán'),
      });

      const newStatus: DisputeStatus =
        decision === 'RefundToBuyer' ? 'RESOLVED_BUYER' : 'RESOLVED_SELLER';

      const updated: Dispute = {
        ...selectedDispute,
        status: newStatus,
        resolutionNote:
          resolutionNote ||
          (decision === 'RefundToBuyer'
            ? 'Hoàn trả 100% tiền ký quỹ cho Người mua'
            : 'Giải ngân tiền ký quỹ cho Người bán'),
        resolvedAt: new Date().toISOString(),
      };

      setDisputes((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
      setSelectedDispute(updated);
      setResolutionNote('');
    } catch (err: any) {
      alert('Lỗi phân xử: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Admin Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-emerald-400" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Cổng Trọng Tài Phân Xử Ký Quỹ
            </h1>
          </div>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
          Admin Arbiter • Solana Escrow
        </span>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 animate-pulse"
                >
                  <div className="h-4 w-24 bg-slate-800 rounded" />
                  <div className="h-5 w-40 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-pulse h-80" />
          </div>
        ) : errorMsg ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm font-bold text-slate-200">{errorMsg}</p>
            <button
              onClick={fetchDisputes}
              className="mt-4 gradient-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-12 max-w-md mx-auto">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-200 text-base">
              Không có tranh chấp nào
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Mọi giao dịch ký quỹ đang diễn ra thuận lợi không có khiếu nại mở.
            </p>
            <Link
              href="/"
              className="gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Disputed Orders List */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Danh sách khiếu nại ({disputes.length})
              </h2>

              <div className="space-y-2.5">
                {disputes.map((d) => {
                  const isSelected = selectedDispute && d.id === selectedDispute.id;
                  const isResolved = d.status.startsWith('RESOLVED');

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDispute(d)}
                      className={`w-full text-left p-4 sm:p-5 rounded-3xl border transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono text-slate-400 font-semibold">
                          #{d.orderId ? d.orderId.slice(-8) : d.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'RESOLVED_BUYER'
                              ? 'bg-red-900/60 text-red-300 border border-red-800'
                              : d.status === 'RESOLVED_SELLER'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-900/60 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {d.status === 'RESOLVED_BUYER'
                            ? 'Đã hoàn Buyer'
                            : d.status === 'RESOLVED_SELLER'
                            ? 'Đã trả Seller'
                            : 'Chờ phân xử'}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-200 line-clamp-1">
                        {d.listingTitle}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-black text-emerald-400">
                          {formatVND(d.amountVnd)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {timeAgo(d.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 2 Columns: Evidence Reviewer & Ruling Console */}
            {selectedDispute && (
              <div className="lg:col-span-2 space-y-6">
                {/* Dispute Case Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-400 font-medium">
                        Khiếu nại #{selectedDispute.id} • Đơn hàng: #{selectedDispute.orderId}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                        {selectedDispute.listingTitle}
                      </h2>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 shrink-0">
                      {formatVND(selectedDispute.amountVnd)}
                    </span>
                  </div>

                  {/* Parties info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        Người mua (Khiếu nại)
                      </span>
                      <span className="font-mono text-slate-300 font-medium truncate block">
                        {selectedDispute.buyerWallet}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        Người bán (Đăng tin)
                      </span>
                      <span className="font-mono text-slate-300 font-medium truncate block">
                        {selectedDispute.sellerWallet}
                      </span>
                    </div>
                  </div>

                  {/* Dispute reason */}
                  <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 text-xs">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Nội dung khiếu nại từ Người mua:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      &ldquo;{selectedDispute.reason}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Evidence Viewer */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Đối chiếu bằng chứng thực tế
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Seller's Original Image */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <span>📸</span> Ảnh Người bán rao bán:
                      </span>
                      <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                        <Image
                          src={selectedDispute.listingImage}
                          alt="Seller listing photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Buyer's Evidence Image */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        <span>📦</span> Bằng chứng Unbox lỗi:
                      </span>
                      <div className="relative aspect-square rounded-2xl overflow-hidden border border-amber-900/40 bg-slate-950">
                        <Image
                          src={
                            selectedDispute.evidenceUrls?.[0] ||
                            selectedDispute.listingImage
                          }
                          alt="Buyer unbox evidence"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ruling Actions */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Quyết định Trọng tài Phán xử
                  </h3>

                  {selectedDispute.status.startsWith('RESOLVED') ? (
                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-1">
                      <span className="text-xs font-bold text-emerald-400">
                        ✅ Vụ việc đã được phân xử hoàn tất!
                      </span>
                      <p className="text-xs text-slate-300">
                        {selectedDispute.resolutionNote || 'Hợp đồng ký quỹ đã được giải quyết.'}
                      </p>
                      {selectedDispute.resolvedAt && (
                        <p className="text-[10px] text-slate-500">
                          Thời gian:{' '}
                          {new Date(selectedDispute.resolvedAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Căn cứ phán quyết / Ghi chú:
                        </label>
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="VD: Bằng chứng lỗi unbox rõ ràng, chấp thuận hoàn tiền Buyer..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleRuling('RefundToBuyer')}
                          disabled={isSubmitting}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-red-950 transition active:scale-95 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Hoàn tiền cho Buyer (100%)</span>
                        </button>

                        <button
                          onClick={() => handleRuling('ReleaseToSeller')}
                          disabled={isSubmitting}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-950 transition active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Thanh toán cho Seller</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
