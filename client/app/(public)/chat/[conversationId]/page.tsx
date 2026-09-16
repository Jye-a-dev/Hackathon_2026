'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  Send,
  Image as ImageIcon,
  CheckCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { formatVND } from '@/utils/formatCurrency';
import { getChatSocket } from '@/libs/socket';
import { chatApi, ordersApi } from '@/libs/api';
import { MOCK_LISTINGS } from '@/constants/mockData';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChatMessage } from '@/types/chat';

export default function DirectChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallet } = useAuthStore();

  const currentListing = MOCK_LISTINGS[0]; // Active context item
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      conversationId: resolvedParams.conversationId,
      senderWallet: 'usr-hoangnam',
      content: 'Chào bạn! Mình có thể hỗ trợ gì cho bạn về máy ảnh Sony A7 III này ạ?',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      createdAt: '2026-09-16T10:00:00.000Z',
    },
    {
      id: 'm2',
      conversationId: resolvedParams.conversationId,
      senderWallet: wallet || 'demo_wallet_abc123',
      content: 'Máy chụp khoảng bao nhiêu shot rồi bạn? Có kèm thêm thẻ nhớ không ạ?',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      createdAt: '2026-09-16T10:05:00.000Z',
    },
    {
      id: 'm3',
      conversationId: resolvedParams.conversationId,
      senderWallet: 'usr-hoangnam',
      content: 'Máy khoảng 5.2k shot bạn nhé, mình tặng kèm thẻ Sony 64GB Extreme Pro 170MB/s luôn ạ!',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      createdAt: '2026-09-16T10:10:00.000Z',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io integration with auto-reconnect
  useEffect(() => {
    let socket: any = null;
    let socket: Socket | null = null;
    try {
      socket = getChatSocket();
      socket.connect();
      socket.emit('join_conversation', { conversationId: resolvedParams.conversationId });

      socket.on('new_message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('partner_typing', () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      });
    } catch (e) {
      console.warn('Socket chat connection error:', e);
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('partner_typing');
        socket.disconnect();
      }
    };
  }, [resolvedParams.conversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: resolvedParams.conversationId,
      senderWallet: wallet || 'demo_wallet_abc123',
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Emit via socket if connected
    try {
      const socket = getChatSocket();
      socket.emit('send_message', newMsg);
    } catch {
      // Offline fallback
    }

    // Auto-reply simulation after 2 seconds for demo interaction
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        conversationId: resolvedParams.conversationId,
        senderWallet: 'usr-hoangnam',
        content: 'Bạn bấm nút "Mua với Ký quỹ" ở trên nhé, tiền được sàn bảo đảm 48h kiểm tra nên bạn yên tâm tuyệt đối!',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between glass px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/chat')}
            aria-label="Quay lại"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="Seller"
              width={38}
              height={38}
              className="rounded-full ring-2 ring-emerald-500/20 object-cover"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900">Nam Vũ Photo</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Đang hoạt động</span>
          </div>
        </div>

        <Link
          href={`/checkout/ord-demo?amount=${currentListing.price}&title=${encodeURIComponent(currentListing.title)}`}
          className="gradient-primary rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 flex items-center gap-1"
        >
          <span>Mua Ký quỹ</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Pinned Order Context Banner */}
      <div className="bg-white border-b border-slate-200/80 p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
            <Image
              src={currentListing.images[0]}
              alt={currentListing.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              {currentListing.title}
            </p>
            <p className="text-xs font-black text-emerald-600">
              {formatVND(currentListing.price)}
            </p>
          </div>
        </div>

        <Link
          href={`/listings/${currentListing.id}`}
          className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
        >
          Xem đồ
        </Link>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center my-2">
          <span className="rounded-full bg-slate-200/60 px-3 py-1 text-[10px] font-medium text-slate-500">
            Hôm nay
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderWallet === (wallet || 'demo_wallet_abc123');

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  isMe ? 'bubble-sent' : 'bubble-received shadow-xs'
                }`}
              >
                {msg.content}
              </div>
              <span className="mt-1 text-[9px] text-slate-400 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 italic pl-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[10px]">Người bán đang gõ...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="glass border-t border-slate-200/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2"
      >
        <button
          type="button"
          aria-label="Đính kèm hình ảnh"
          onClick={() => alert('Chọn ảnh đính kèm từ thư viện')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <button
          type="submit"
          aria-label="Gửi tin nhắn"
          disabled={!inputText.trim()}
          className="gradient-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-emerald-200 disabled:opacity-40 transition active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
