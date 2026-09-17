'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  Send,
  Image as ImageIcon,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { formatVND } from '@/utils/formatCurrency';
import { getChatSocket } from '@/libs/socket';
import { chatApi, listingsApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChatMessage } from '@/types/chat';
import type { Listing } from '@/types/listing';

import { Suspense } from 'react';

function DirectChatContent({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallet } = useAuthStore();

  const currentWallet = wallet || 'BuyerMockWallet4752331111111111111111111';
  const listingId = searchParams.get('listingId');
  const sellerParam = searchParams.get('seller');

  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load real messages & real listing
  useEffect(() => {
    async function initChat() {
      try {
        setLoading(true);
        if (listingId) {
          const l = await listingsApi.get(listingId).catch(() => null);
          if (l) setListing(l);
        }

        const msgs = await chatApi.getMessages(resolvedParams.conversationId);
        setMessages(msgs);
      } catch (err) {
        console.warn('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    }

    void initChat();
  }, [resolvedParams.conversationId, listingId]);

  // Socket.io integration
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = getChatSocket();
      socket.connect();
      socket.emit('join_conversation', {
        conversationId: resolvedParams.conversationId,
      });

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const savedMsg = await chatApi.sendMessage(
        resolvedParams.conversationId,
        currentWallet,
        content,
      );
      setMessages((prev) => [...prev, savedMsg]);

      const socket = getChatSocket();
      socket.emit('send_message', savedMsg);
    } catch {
      // Optimistic fallback
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: resolvedParams.conversationId,
        senderWallet: currentWallet,
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const partnerWallet = sellerParam || 'SellerMockWallet47523322222222222222222';
  const partnerName =
    partnerWallet.length > 12
      ? `${partnerWallet.slice(0, 6)}...${partnerWallet.slice(-4)}`
      : partnerWallet;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between glass px-4 py-3 border-b border-slate-100 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/chat')}
            aria-label="Quay lại"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs hover:bg-slate-100 text-slate-700 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative">
            <Image
              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${partnerWallet}`}
              alt="Partner"
              width={38}
              height={38}
              className="rounded-full ring-2 ring-emerald-500/20 object-cover bg-slate-100"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900">{partnerName}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Đang hoạt động</span>
          </div>
        </div>

        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="gradient-primary rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 flex items-center gap-1"
          >
            <span>Mua Ký quỹ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>

      {/* Pinned Listing Context Banner if present */}
      {listing && (
        <div className="bg-white border-b border-slate-200/80 p-3 shadow-2xs max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {listing.title}
              </p>
              <p className="text-xs font-black text-emerald-600">
                {formatVND(listing.price)}
              </p>
            </div>
          </div>

          <Link
            href={`/listings/${listing.id}`}
            className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
          >
            Xem tin
          </Link>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Đang tải lịch sử trò chuyện...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              msg.senderWallet.toLowerCase() === currentWallet.toLowerCase();

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isMe ? 'bubble-sent text-white' : 'bubble-received shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-1 text-[9px] text-slate-400 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 italic pl-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[10px]">Đối tác đang nhập...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="glass border-t border-slate-200/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
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
    </div>
  );
}

export default function DirectChatPage(props: {
  params: Promise<{ conversationId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-xs font-semibold text-slate-400">
          Đang tải cuộc trò chuyện...
        </div>
      }
    >
      <DirectChatContent {...props} />
    </Suspense>
  );
}
