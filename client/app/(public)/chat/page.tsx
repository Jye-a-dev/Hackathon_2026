'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  MessageCircle,
  LogIn,
  Send,
  ArrowRight,
  Package,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { EmptyState, ErrorBanner } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Money } from '@/domain/value-objects/Money';
import { useConversations, useCurrentUser } from '@/hooks/useMarketplace';
import { getChatSocket } from '@/libs/socket';
import { chatApi, listingsApi } from '@/libs/api';
import { timeAgo } from '@/utils/formatTime';
import type { Conversation, ChatMessage } from '@/types/chat';
import type { Listing } from '@/types/listing';

interface ApiErrorObject {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 border border-neutral-100">
      <Skeleton className="h-11 w-11 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isAuthLoading } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Active chat state for split-pane right pane
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentWallet = currentUser?.id ?? '';
  const isLoggedIn = Boolean(currentUser?.id);

  const {
    data: conversations,
    isLoading,
    isError,
    error,
    refetch,
  } = useConversations(currentWallet ? 'me' : '');

  const filteredConversations = (conversations ?? []).filter((c: Conversation) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.listingTitle ?? '').toLowerCase().includes(term) ||
      c.buyerWallet.toLowerCase().includes(term) ||
      c.sellerWallet.toLowerCase().includes(term)
    );
  });

  // Purely derived active conversation: explicit selection or first conversation in list
  const activeSelectedConvId =
    selectedConvId ?? (filteredConversations.length > 0 ? filteredConversations[0].id : null);

  const activeConv = conversations?.find((c) => c.id === activeSelectedConvId) ?? null;

  // Load messages & listing when active conversation changes
  useEffect(() => {
    if (!activeSelectedConvId) return;

    let isSubscribed = true;
    const convId = activeSelectedConvId;

    async function loadThread() {
      try {
        const [listingData, msgs] = await Promise.all([
          activeConv?.listingId
            ? listingsApi.get(activeConv.listingId).catch(() => null)
            : Promise.resolve(null),
          chatApi.getMessages(convId).catch(() => []),
        ]);

        if (isSubscribed) {
          setActiveListing(listingData);
          setMessages(msgs);
        }
      } catch (err) {
        console.warn('Error loading thread:', err);
      } finally {
        if (isSubscribed) {
          setLoadingMessages(false);
        }
      }
    }

    void loadThread();

    return () => {
      isSubscribed = false;
    };
  }, [activeSelectedConvId, activeConv?.listingId]);

  // Socket.io for active conversation
  useEffect(() => {
    if (!activeSelectedConvId) return;

    let socket: Socket | null = null;
    try {
      socket = getChatSocket();
      socket.connect();
      socket.emit('join_conversation', { conversationId: activeSelectedConvId });

      const handleNewMessage = (msg: ChatMessage) => {
        if (msg.conversationId === activeSelectedConvId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      };

      socket.on('receive_message', handleNewMessage);
      socket.on('new_message', handleNewMessage);

      socket.on('partner_typing', () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      });
    } catch (e) {
      console.warn('Socket error in chat page:', e);
    }

    return () => {
      if (socket) {
        socket.off('receive_message');
        socket.off('new_message');
        socket.off('partner_typing');
      }
    };
  }, [activeSelectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSelectedConvId) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const savedMsg = await chatApi.sendMessage(activeSelectedConvId, currentWallet, content);
      setMessages((prev) => [...prev, savedMsg]);

      const socket = getChatSocket();
      socket.emit('send_message', savedMsg);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg-${activeSelectedConvId}-${messages.length + 1}`,
        conversationId: activeSelectedConvId,
        senderWallet: currentWallet,
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  if (!isAuthLoading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Header title="Tin nhắn Ký Quỹ" showLocation={false} />
        <EmptyState
          icon={LogIn}
          title="Đăng nhập để xem tin nhắn"
          description="Bạn cần đăng nhập để trao đổi an toàn với người mua và người bán."
          action={{ label: 'Đăng nhập ngay', href: '/auth/login' }}
        />
        <BottomNav />
      </div>
    );
  }

  const partnerWallet = activeConv?.sellerWallet ?? '';
  const partnerName =
    partnerWallet.length > 12
      ? `${partnerWallet.slice(0, 6)}...${partnerWallet.slice(-4)}`
      : partnerWallet || 'Đối tác';

  const formattedPrice = activeListing
    ? new Money(activeListing.price, 'VND').format()
    : activeConv?.listingPrice
    ? new Money(activeConv.listingPrice, 'VND').format()
    : null;

  const errorMessage =
    (error as ApiErrorObject)?.response?.data?.message ??
    (error as Error)?.message ??
    'Lỗi tải cuộc trò chuyện';

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Header title="Tin nhắn Ký Quỹ" showLocation={false} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="h-[calc(100vh-140px)] rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden md:grid md:grid-cols-12">
          
          {/* ── Left Pane: Conversation List (md:col-span-5 lg:col-span-4) ── */}
          <div className="h-full border-r border-neutral-200 flex flex-col md:col-span-5 lg:col-span-4">
            {/* Search Input */}
            <div className="p-3.5 border-b border-neutral-100">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Tìm kiếm trò chuyện..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ConversationSkeleton key={i} />
                  ))}
                </div>
              )}

              {isError && !isLoading && (
                <div className="p-4">
                  <ErrorBanner
                    message={errorMessage}
                    onRetry={() => refetch()}
                  />
                </div>
              )}

              {!isLoading && !isError && filteredConversations.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-400 space-y-2">
                  <MessageCircle className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="font-semibold text-neutral-600">Chưa có cuộc trò chuyện nào</p>
                  <p>Khi bạn liên hệ người bán, cuộc trò chuyện sẽ hiển thị tại đây.</p>
                </div>
              )}

              {!isLoading &&
                !isError &&
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeSelectedConvId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          router.push(`/chat/${conv.id}`);
                        }
                      }}
                      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                        isSelected
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-neutral-100 border border-neutral-200">
                        {conv.listingImage ? (
                          <Image src={conv.listingImage} alt={conv.listingTitle ?? 'Sản phẩm'} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-neutral-500 text-xs">
                            {(conv.listingTitle || 'K').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`truncate text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                            {conv.listingTitle ?? partnerName}
                          </p>
                          {conv.lastMessageAt && (
                            <span className={`text-[10px] font-mono shrink-0 ml-1 ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                              {timeAgo(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>

                        <p className={`truncate text-[11px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {conv.lastMessage ?? 'Bắt đầu cuộc trò chuyện...'}
                        </p>

                        {conv.listingPrice && (
                          <p className={`text-[11px] font-bold font-sans mt-0.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                            {new Money(conv.listingPrice, 'VND').format()}
                          </p>
                        )}
                      </div>

                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ── Right Pane: Live Message Thread (md:col-span-7 lg:col-span-8) ── */}
          <div className="hidden md:flex md:col-span-7 lg:col-span-8 flex-col h-full bg-[#fafafa]">
            {activeSelectedConvId && activeConv ? (
              <>
                {/* Pinned Context Header: Product summary card + quick action "+ Tạo đơn ký quỹ" */}
                <div className="bg-white border-b border-neutral-200 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      {activeListing?.images?.[0] || activeConv.listingImage ? (
                        <Image
                          src={activeListing?.images?.[0] || activeConv.listingImage || ''}
                          alt={activeListing?.title || activeConv.listingTitle || 'Sản phẩm'}
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
                        {activeListing?.title || activeConv.listingTitle || 'Sản phẩm Ký Quỹ'}
                      </p>
                      {formattedPrice && (
                        <p className="text-xs font-extrabold text-emerald-600 font-sans">
                          {formattedPrice}
                        </p>
                      )}
                    </div>
                  </div>

                  {(activeListing?.id || activeConv.listingId) && (
                    <Link
                      href={`/listings/${activeListing?.id || activeConv.listingId}`}
                      className="flex items-center gap-1 shrink-0 rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-neutral-800 shadow-2xs"
                    >
                      <span>+ Mua Ký Quỹ</span>
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                    </Link>
                  )}
                </div>

                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center text-xs text-neutral-400">
                      Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        Boolean(currentWallet) &&
                        msg.senderWallet.toLowerCase() === currentWallet.toLowerCase();

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
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
                      <span className="text-[10px]">Đối tác đang nhập...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="bg-white border-t border-neutral-200 p-3">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Nhập nội dung trao đổi ký quỹ..."
                      className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:opacity-40"
                      aria-label="Gửi"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                <MessageCircle className="h-12 w-12 text-neutral-300 mb-2" />
                <h3 className="text-sm font-bold text-neutral-700">Chọn cuộc trò chuyện</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu trao đổi chi tiết về sản phẩm.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
