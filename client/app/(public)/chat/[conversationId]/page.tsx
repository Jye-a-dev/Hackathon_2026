'use client';

import { use, useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShieldCheck,
  Send,
  ArrowRight,
  Package,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { Money } from '@/domain/value-objects/Money';
import { getChatSocket } from '@/libs/socket';
import { chatApi, listingsApi } from '@/libs/api';
import { useCurrentUser } from '@/hooks/useMarketplace';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeChatMessage } from '@/libs/normalizers';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types/chat';
import type { Listing } from '@/types/listing';

function DirectChatContent({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: currentUser } = useCurrentUser();
  const { user: storeUser } = useAuthStore();
  const activeUser = currentUser || storeUser;
  const rawWallet =
    activeUser?.wallet_address ||
    activeUser?.wallet ||
    activeUser?.id ||
    '';
  const currentWallet = rawWallet !== 'me' ? rawWallet : '';

  const listingId = searchParams.get('listingId');
  const sellerParam = searchParams.get('seller');

  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (smooth = true) => {
    if (!messageContainerRef.current) return;
    const { scrollHeight, clientHeight } = messageContainerRef.current;
    messageContainerRef.current.scrollTo({
      top: scrollHeight - clientHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };


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
        requestAnimationFrame(() => scrollToBottom(false));
      } catch (err) {
        console.warn('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    }

    void initChat();
  }, [resolvedParams.conversationId, listingId]);

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = getChatSocket();
      socket.connect();

      const joinPayload = { conversationId: resolvedParams.conversationId };
      socket.emit('join_room', joinPayload);
      socket.emit('join_conversation', joinPayload);

      const handleIncomingMessage = (rawMsg: unknown) => {
        const msg = normalizeChatMessage(rawMsg);
        if (String(msg.conversationId) === String(resolvedParams.conversationId)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          requestAnimationFrame(() => scrollToBottom(true));
        }
      };

      socket.on('new_message', handleIncomingMessage);
      socket.on('receive_message', handleIncomingMessage);

      socket.on('partner_typing', () => {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      });

      socket.on('user_typing', (data: { conversationId: string; senderWallet: string; isTyping: boolean }) => {
        if (
          String(data.conversationId) === String(resolvedParams.conversationId) &&
          data.senderWallet?.toLowerCase() !== currentWallet.toLowerCase()
        ) {
          setIsTyping(data.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        }
      });
    } catch (e) {
      console.warn('Socket chat connection error:', e);
    }

    return () => {
      if (socket) {
        socket.emit('leave_room', { conversationId: resolvedParams.conversationId });
        socket.emit('leave_conversation', { conversationId: resolvedParams.conversationId });
        socket.off('new_message');
        socket.off('receive_message');
        socket.off('partner_typing');
        socket.off('user_typing');
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [resolvedParams.conversationId, currentWallet]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!currentWallet) return;

    try {
      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit('typing', {
          conversationId: resolvedParams.conversationId,
          senderWallet: currentWallet,
          isTyping: true,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentWallet) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit('typing', {
          conversationId: resolvedParams.conversationId,
          senderWallet: currentWallet,
          isTyping: false,
        });
      }
    } catch {
      // ignore
    }

    const payload = {
      conversationId: resolvedParams.conversationId,
      senderId: currentWallet,
      senderWallet: currentWallet,
      content,
      listingId: listing?.id,
    };

    try {
      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit('send_message', payload, (res: unknown) => {
          if (res) {
            const saved = normalizeChatMessage(res);
            setMessages((prev) => {
              if (prev.some((m) => m.id === saved.id)) return prev;
              return [...prev, saved];
            });
            requestAnimationFrame(() => scrollToBottom(true));
          }
        });
      } else {
        const savedMsg = await chatApi.sendMessage(
          resolvedParams.conversationId,
          currentWallet,
          content,
        );
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        requestAnimationFrame(() => scrollToBottom(true));
      }

    } catch {
      toast.error('Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.');
    }
  };

  const partnerWallet = sellerParam || listing?.seller?.id || 'Người bán';
  const partnerName =
    partnerWallet.length > 12
      ? `${partnerWallet.slice(0, 6)}...${partnerWallet.slice(-4)}`
      : partnerWallet;

  const priceFormatted = listing ? new Money(listing.price, 'VND').format() : null;

  return (
    <div className="flex flex-col h-screen bg-[#fafafa]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-3 border-b border-neutral-200 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/chat')}
            aria-label="Quay lại"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
              {partnerName.slice(0, 1).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-neutral-900">{partnerName}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Đang trực tuyến</span>
          </div>
        </div>

        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 flex items-center gap-1 transition"
          >
            <span>Mua Ký Quỹ</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
          </Link>
        )}
      </header>

      {/* Pinned Context Banner */}
      {listing && (
        <div className="bg-white border-b border-neutral-200/80 p-3 max-w-4xl mx-auto w-full flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
              {listing.images && listing.images[0] ? (
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <Package className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">
                {listing.title}
              </p>
              <p className="text-xs font-extrabold text-emerald-600 font-sans">
                {priceFormatted}
              </p>
            </div>
          </div>

          <Link
            href={`/listings/${listing.id}`}
            className="shrink-0 rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 transition"
          >
            Xem tin
          </Link>
        </div>
      )}

      {/* Message List */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full no-scrollbar"
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            Đang tải lịch sử trò chuyện...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên để trao đổi về sản phẩm!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              Boolean(currentWallet) &&
              (msg.senderWallet.toLowerCase() === currentWallet.toLowerCase() ||
               Boolean(activeUser?.id && msg.senderWallet.toLowerCase() === activeUser.id.toLowerCase()));

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-neutral-900 text-white rounded-br-xs'
                      : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-1 text-[9px] text-neutral-400 px-1 font-mono">
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
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 italic pl-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[10px]">Đối tác đang nhập tin nhắn...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-hidden"
          />

          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            disabled={!inputText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:opacity-40"
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
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8 text-xs font-semibold text-neutral-400">
          Đang tải cuộc trò chuyện...
        </div>
      }
    >
      <DirectChatContent {...props} />
    </Suspense>
  );
}
