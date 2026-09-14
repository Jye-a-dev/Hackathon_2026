'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShieldCheck, CheckCheck } from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { MOCK_LISTINGS } from '@/constants/mockData';

interface MockConversationItem {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  isVerified: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  listingTitle: string;
  listingImage: string;
}

export default function ChatListPage() {
  const [conversations] = useState<MockConversationItem[]>([
    {
      id: 'conv-001',
      partnerName: 'Nam Vũ Photo',
      partnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isVerified: true,
      lastMessage: 'Dạ máy vẫn còn bạn nhé, bạn có thể bấm Mua với Ký quỹ để mình ship ngay trong chiều!',
      lastTime: '10:42',
      unreadCount: 1,
      listingTitle: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm',
      listingImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'conv-002',
      partnerName: 'Linh Chi Vintage',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      isVerified: true,
      lastMessage: 'Áo chuẩn size L bạn nha, da bò thật rất thơm.',
      lastTime: 'Hôm qua',
      unreadCount: 0,
      listingTitle: 'Áo khoác da thật Vintage Biker Jacket size L',
      listingImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'conv-003',
      partnerName: 'Minh Hoàng Kicks',
      partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      isVerified: true,
      lastMessage: 'Đơn hàng của bạn đã gửi qua GHN mã vận đơn: 882194',
      lastTime: '12/09',
      unreadCount: 0,
      listingTitle: 'Giày Nike Air Jordan 1 Retro High OG Chicago',
      listingImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=200&q=80',
    },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Header title="Tin nhắn" showLocation={false} />

      <div className="max-w-lg mx-auto p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn, người bán..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Conversation list */}
        <div className="divide-y divide-slate-100 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition"
            >
              <div className="relative">
                <Image
                  src={c.partnerAvatar}
                  alt={c.partnerName}
                  width={48}
                  height={48}
                  className="rounded-full ring-2 ring-emerald-500/20 object-cover"
                />
                {c.isVerified && (
                  <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-emerald-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{c.partnerName}</h4>
                  <span className="text-[10px] text-slate-400">{c.lastTime}</span>
                </div>

                <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.lastMessage}</p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {c.listingTitle}
                  </span>
                </div>
              </div>

              {c.unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
