'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShieldCheck, MessageCircle, RefreshCw } from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { chatApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { Conversation } from '@/types/chat';

export default function ChatListPage() {
  const { wallet } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentWallet =
    wallet || 'BuyerMockWallet4653141111111111111111111';

  const loadConversations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await chatApi.listConversations(currentWallet);
      setConversations(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentWallet]);

  const filtered = conversations.filter((c) => {
    const partner =
      c.buyerWallet.toLowerCase() === currentWallet.toLowerCase()
        ? c.sellerWallet
        : c.buyerWallet;
    return (
      partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.id && c.id.includes(searchTerm))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <Header title="Tin nhắn" showLocation={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm đối tác chat, ví..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        {/* Conversation list */}
        {loading ? (
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 py-2">
                <div className="skeleton h-12 w-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-3.5 w-32" />
                  <div className="skeleton h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-red-100 p-6 shadow-xs">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-xs font-bold text-slate-800">{errorMsg}</p>
            <button
              onClick={loadConversations}
              className="mt-3 inline-flex items-center gap-1.5 gradient-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-xs max-w-md mx-auto">
            <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Chưa có cuộc trò chuyện nào</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Nhắn tin với người bán trên tin đăng để bắt đầu trao đổi.
            </p>
            <Link
              href="/"
              className="gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm inline-block"
            >
              Xem các món đồ đang bán
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden">
            {filtered.map((c) => {
              const isBuyer =
                c.buyerWallet.toLowerCase() === currentWallet.toLowerCase();
              const partnerWallet = isBuyer ? c.sellerWallet : c.buyerWallet;
              const displayName =
                partnerWallet.length > 12
                  ? `${partnerWallet.slice(0, 6)}...${partnerWallet.slice(-4)}`
                  : partnerWallet;

              return (
                <Link
                  key={c.id}
                  href={`/chat/${c.id}${c.listingId ? `?listingId=${c.listingId}` : ''}`}
                  className="flex items-center gap-3.5 p-4 hover:bg-slate-50 transition"
                >
                  <div className="relative shrink-0">
                    <Image
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${partnerWallet}`}
                      alt={displayName}
                      width={48}
                      height={48}
                      className="rounded-full ring-2 ring-emerald-500/20 object-cover bg-slate-100"
                    />
                    <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-emerald-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {displayName}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.lastMessageAt || c.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Đối tác giao dịch P2P
                    </p>

                    {c.listingId && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                          Sản phẩm #{c.listingId}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
