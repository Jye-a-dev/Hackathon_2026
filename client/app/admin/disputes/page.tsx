'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldAlert,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { formatVND } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatTime';
import { disputesApi } from '@/libs/api';
import type { Dispute, DisputeStatus } from '@/types/dispute';

const INITIAL_MOCK_DISPUTES: Dispute[] = [
  {
    id: 'disp-001',
    orderId: 'ord-889214',
    listingTitle: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm OSS Fullbox 99%',
    listingImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    buyerWallet: '0xBuyer...123',
    sellerWallet: '0xSeller...999',
    amountVnd: 24500000,
    reason: 'Ống kính có vết xước sâu trên thấu kính trước khiến ảnh chụp bị lóa nặng khi ngược sáng. Người bán không đề cập trong phần mô tả tình trạng 99%.',
    evidenceUrls: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
    ],
    chatHistory: [
      { sender: 'Buyer', content: 'Chào bạn, mình mở hộp thì thấy kính trước có vết trầy xước khá rõ.', createdAt: '10:15' },
      { sender: 'Seller', content: 'Lúc mình gửi đi bình thường mà bạn, có thể do đơn vị vận chuyển chăng?', createdAt: '10:20' },
      { sender: 'Buyer', content: 'Hộp bên ngoài nguyên vẹn niêm phong, mình có quay video unbox từ đầu.', createdAt: '10:22' },
    ],
    status: 'OPEN',
    createdAt: '2026-09-16T18:00:00.000Z',
  },
  {
    id: 'disp-002',
    orderId: 'ord-552100',
    listingTitle: 'Bàn phím cơ Custom Keychron Q1 Pro',
    listingImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    buyerWallet: '0xBuyer...456',
    sellerWallet: '0xSeller...789',
    amountVnd: 3200000,
    reason: 'Hàng không đúng màu sắc đặt mua (giao màu bạc thay vì carbon đen).',
    evidenceUrls: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'UNDER_REVIEW',
    createdAt: '2026-09-16T05:00:00.000Z',
  },
];

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: 'disp-001',
      orderId: 'ord-889214',
      listingTitle: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm OSS Fullbox 99%',
      listingImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      buyerWallet: '0xBuyer...123',
      sellerWallet: '0xSeller...999',
      amountVnd: 24500000,
      reason: 'Ống kính có vết xước sâu trên thấu kính trước khiến ảnh chụp bị lóa nặng khi ngược sáng. Người bán không đề cập trong phần mô tả tình trạng 99%.',
      evidenceUrls: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
      ],
      chatHistory: [
        { sender: 'Buyer', content: 'Chào bạn, mình mở hộp thì thấy kính trước có vết trầy xước khá rõ.', createdAt: '10:15' },
        { sender: 'Seller', content: 'Lúc mình gửi đi bình thường mà bạn, có thể do đơn vị vận chuyển chăng?', createdAt: '10:20' },
        { sender: 'Buyer', content: 'Hộp bên ngoài nguyên vẹn niêm phong, mình có quay video unbox từ đầu.', createdAt: '10:22' },
      ],
      status: 'OPEN',
      createdAt: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    },
    {
      id: 'disp-002',
      orderId: 'ord-552100',
      listingTitle: 'Bàn phím cơ Custom Keychron Q1 Pro',
      listingImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      buyerWallet: '0xBuyer...456',
      sellerWallet: '0xSeller...789',
      amountVnd: 3200000,
      reason: 'Hàng không đúng màu sắc đặt mua (giao màu bạc thay vì carbon đen).',
      evidenceUrls: [
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
      ],
      status: 'UNDER_REVIEW',
      createdAt: new Date(Date.now() - 1000 * 3600 * 18).toISOString(),
    },
  ]);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_MOCK_DISPUTES);

  const [selectedDispute, setSelectedDispute] = useState<Dispute>(disputes[0]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRuling = async (decision: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER') => {
    setIsSubmitting(true);
    try {
      await disputesApi.resolve(selectedDispute.id, {
        resolution: decision,
        note: resolutionNote || (decision === 'REFUND_TO_BUYER' ? 'Chấp thuận hoàn tiền do lỗi sản phẩm' : 'Bác bỏ khiếu nại, giải ngân cho người bán'),
      });
    } catch {
      // Offline fallback
    }

    const newStatus: DisputeStatus = decision === 'REFUND_TO_BUYER' ? 'RESOLVED_BUYER' : 'RESOLVED_SELLER';

    const updated = {
      ...selectedDispute,
      status: newStatus,
      resolutionNote: resolutionNote || (decision === 'REFUND_TO_BUYER' ? 'Hoàn trả 100% tiền ký quỹ cho Người mua' : 'Giải ngân tiền ký quỹ cho Người bán'),
      resolvedAt: new Date().toISOString(),
    };

    setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDispute(updated);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Admin Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-emerald-400" />
            <h1 className="text-lg font-bold tracking-tight text-white">
              Cổng Trọng Tài Phân Xử Ký Quỹ
            </h1>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
          Admin Portal • P2P Escrow Arbiter
        </span>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Disputed Orders List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Danh sách đơn tranh chấp ({disputes.length})
          </h2>

          <div className="space-y-2">
            {disputes.map((d) => {
              const isSelected = d.id === selectedDispute.id;
              const isResolved = d.status.startsWith('RESOLVED');

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-slate-400 font-semibold">#{d.orderId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'RESOLVED_BUYER'
                          ? 'bg-red-900/60 text-red-300'
                          : d.status === 'RESOLVED_SELLER'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-amber-900/60 text-amber-300'
                      }`}
                    >
                      {d.status === 'RESOLVED_BUYER'
                        ? 'Đã hoàn Buyer'
                        : d.status === 'RESOLVED_SELLER'
                        ? 'Đã trả Seller'
                        : 'Chờ phân xử'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{d.listingTitle}</h3>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="font-black text-emerald-400">{formatVND(d.amountVnd)}</span>
                    <span className="text-[10px] text-slate-500">{timeAgo(d.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Evidence Reviewer & Ruling Console */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Case Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-slate-400 font-medium">
                  Mã tranh chấp: {selectedDispute.id} • Đơn hàng: {selectedDispute.orderId}
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  {selectedDispute.listingTitle}
                </h2>
              </div>
              <span className="text-xl font-black text-emerald-400">
                {formatVND(selectedDispute.amountVnd)}
              </span>
            </div>

            {/* Parties info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px]">Người mua (Khiếu nại)</span>
                <span className="font-mono text-slate-300 font-medium">{selectedDispute.buyerWallet}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Người bán (Đăng tin)</span>
                <span className="font-mono text-slate-300 font-medium">{selectedDispute.sellerWallet}</span>
              </div>
            </div>

            {/* Dispute reason */}
            <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Nội dung khiếu nại từ Người mua:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">&ldquo;{selectedDispute.reason}&rdquo;</p>
            </div>
          </div>

          {/* Side-by-Side Evidence Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đối chiếu bằng chứng thực tế
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seller's Original Image */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>📸</span> Ảnh gốc Người bán rao bán:
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

              {/* Buyer's Unbox Evidence Image */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <span>📦</span> Ảnh bằng chứng Unbox lỗi Người mua:
                </span>
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-amber-900/40 bg-slate-950">
                  <Image
                    src={selectedDispute.evidenceUrls[0]}
                    alt="Buyer unbox evidence"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chat History Snippet */}
          {selectedDispute.chatHistory && selectedDispute.chatHistory.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MessageSquare className="h-4 w-4" />
                <span>Lịch sử chat đối thoại giữa hai bên</span>
              </div>

              <div className="space-y-2 text-xs">
                {selectedDispute.chatHistory.map((chat, i) => (
                  <div key={i} className="flex gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="font-bold text-slate-400 w-14 shrink-0">[{chat.sender}]:</span>
                    <span className="text-slate-300 flex-1">{chat.content}</span>
                    <span className="text-[10px] text-slate-500">{chat.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ruling Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quyết định Trọng tài Phân xử
            </h3>

            {selectedDispute.status.startsWith('RESOLVED') ? (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-1">
                <span className="text-xs font-bold text-emerald-400">
                  ✅ Vụ việc đã được phân xử hoàn tất!
                </span>
                <p className="text-xs text-slate-300">{selectedDispute.resolutionNote}</p>
                <p className="text-[10px] text-slate-500">Thời gian: {selectedDispute.resolvedAt}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ghi chú phán quyết / Căn cứ giải quyết:
                  </label>
                  <input
                    type="text"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="VD: Bằng chứng thấu kính xước rõ rệt trong clip unbox, chấp thuận hoàn tiền Buyer..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleRuling('REFUND_TO_BUYER')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-red-950 transition active:scale-95 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Hoàn tiền cho Buyer (100%)</span>
                  </button>

                  <button
                    onClick={() => handleRuling('RELEASE_TO_SELLER')}
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
      </div>
    </div>
  );
}
