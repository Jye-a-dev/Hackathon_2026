'use client';

import { useState, useEffect, useRef, useSyncExternalStore, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  MessageCircle,
  LogIn,
  Send,
  ArrowRight,
  Package,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Money } from '@/domain/value-objects/Money';
import { useConversations, useCurrentUser } from '@/hooks/useMarketplace';
import { getChatSocket } from '@/libs/socket';
import { chatApi, listingsApi } from '@/libs/api';
import { normalizeChatMessage } from '@/libs/normalizers';
import { timeAgo } from '@/utils/formatTime';
import type { Conversation, ChatMessage } from '@/types/chat';
import type { Listing } from '@/types/listing';
import { queryClient } from '@/libs/queryClient';

const HIDDEN_CONVERSATIONS_KEY = 'kyquy_hidden_conversations';

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

function ChatClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingParam = searchParams.get('listingId');
  const sellerParam = searchParams.get('seller');
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const token = typeof window !== 'undefined' ? localStorage.getItem('kyquy_token') : null;
  const { data: currentUser, isLoading } = useCurrentUser();
  const isAuthenticated = Boolean(token && currentUser);

  // Send the real currentUser.id or wallet, NEVER the static string 'me'
  const currentUserId =
    (currentUser?.id && currentUser.id !== 'me' ? currentUser.id : '') ||
    (currentUser?.wallet_address && currentUser.wallet_address !== 'me' ? currentUser.wallet_address : '') ||
    (currentUser?.wallet && currentUser.wallet !== 'me' ? currentUser.wallet : '');

  const userWallet = currentUserId;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'hidden'>('all');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Persistent hidden conversation IDs
  const [hiddenConvIds, setHiddenConvIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(HIDDEN_CONVERSATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const hiddenConvIdsRef = useRef(hiddenConvIds);
  useEffect(() => {
    hiddenConvIdsRef.current = hiddenConvIds;
  }, [hiddenConvIds]);

  const persistHiddenConvIds = (newIds: string[]) => {
    setHiddenConvIds(newIds);
    try {
      localStorage.setItem(HIDDEN_CONVERSATIONS_KEY, JSON.stringify(newIds));
    } catch {
      // ignore storage errors
    }
  };

  const hideConversation = (convId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hiddenConvIds.includes(convId)) return;

    const nextHidden = [...hiddenConvIds, convId];
    persistHiddenConvIds(nextHidden);

    if (selectedConvId === convId) {
      setSelectedConvId(null);
    }

    toast('Đã ẩn cuộc hội thoại', {
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          restoreConversation(convId);
        },
      },
    });
  };

  const restoreConversation = (convId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextHidden = hiddenConvIds.filter((id) => id !== convId);
    persistHiddenConvIds(nextHidden);
    toast.success('Đã khôi phục cuộc trò chuyện');
  };

  // Active chat state
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
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

  const {
    data: conversations,
    isLoading: isConversationsLoading,
    isError,
    error,
    refetch: refetchConversations,
  } = useConversations(currentUserId);

  // Initialize or select conversation from listingId / seller query parameters
  useEffect(() => {
    if (!userWallet || (!listingParam && !sellerParam)) return;

    let isMounted = true;
    async function initConversationFromQuery() {
      try {
        const partnerWallet = sellerParam || '';
        if (partnerWallet && partnerWallet.toLowerCase() !== userWallet.toLowerCase()) {
          const conv = await chatApi.getOrCreateConversation(
            userWallet,
            partnerWallet,
            listingParam || undefined,
          );
          if (isMounted && conv?.id) {
            setSelectedConvId(conv.id);
            // If the requested thread was hidden, unhide it
            if (hiddenConvIdsRef.current.includes(conv.id)) {
              const nextHidden = hiddenConvIdsRef.current.filter((id) => id !== conv.id);
              persistHiddenConvIds(nextHidden);
            }
            void refetchConversations();
          }
        }
      } catch (err) {
        console.warn('Failed to get or create conversation:', err);
      }
    }

    void initConversationFromQuery();
    return () => {
      isMounted = false;
    };
  }, [userWallet, listingParam, sellerParam, refetchConversations]);

  // Tab and search filtering
  const filteredConversations = (conversations ?? []).filter((c: Conversation) => {
    const isHidden = hiddenConvIds.includes(c.id);
    if (activeTab === 'all' && isHidden) return false;
    if (activeTab === 'hidden' && !isHidden) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.listingTitle ?? '').toLowerCase().includes(term) ||
      c.buyerWallet.toLowerCase().includes(term) ||
      c.sellerWallet.toLowerCase().includes(term)
    );
  });

  const activeSelectedConvId = selectedConvId;
  const activeConv = conversations?.find((c) => c.id === activeSelectedConvId) ?? null;

  // Load messages & listing details for selected thread
  useEffect(() => {
    if (!activeSelectedConvId) {
      return;
    }

    let isSubscribed = true;
    const convId = activeSelectedConvId;

    async function loadThread() {
      setLoadingMessages(true);
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
          requestAnimationFrame(() => scrollToBottom(false));
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

  // Real-time Socket.io integration
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = getChatSocket();
      socket.connect();

      if (activeSelectedConvId) {
        const joinPayload = { conversationId: activeSelectedConvId };
        socket.emit('join_room', joinPayload);
        socket.emit('join_conversation', joinPayload);
      }

      const handleIncomingMessage = (rawMsg: unknown) => {
        const msg = normalizeChatMessage(rawMsg);
        const incomingConvId = String(msg.conversationId);

        // Auto-unhide conversation when counterparty sends a new message
        if (hiddenConvIdsRef.current.includes(incomingConvId)) {
          const nextHidden = hiddenConvIdsRef.current.filter((id) => id !== incomingConvId);
          persistHiddenConvIds(nextHidden);
        }

        if (incomingConvId === String(activeSelectedConvId)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          requestAnimationFrame(() => scrollToBottom(true));
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        void refetchConversations();
      };

      const handleConversationUpdated = (data: { conversationId: string; lastMessage?: unknown }) => {
        const incomingConvId = String(data.conversationId);

        // Auto-unhide if counterparty sends a message
        if (hiddenConvIdsRef.current.includes(incomingConvId)) {
          const nextHidden = hiddenConvIdsRef.current.filter((id) => id !== incomingConvId);
          persistHiddenConvIds(nextHidden);
        }

        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        void refetchConversations();
        if (data?.lastMessage && incomingConvId === String(activeSelectedConvId)) {
          const msg = normalizeChatMessage(data.lastMessage);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          requestAnimationFrame(() => scrollToBottom(true));
        }
      };

      socket.on('receive_message', handleIncomingMessage);
      socket.on('new_message', handleIncomingMessage);
      socket.on('conversation_updated', handleConversationUpdated);
      socket.on('new_message_notification', handleConversationUpdated);

      socket.on('partner_typing', () => {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      });

      socket.on('user_typing', (data: { conversationId: string; senderWallet: string; isTyping: boolean }) => {
        if (
          String(data.conversationId) === String(activeSelectedConvId) &&
          data.senderWallet?.toLowerCase() !== userWallet.toLowerCase()
        ) {
          setIsTyping(data.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        }
      });
    } catch (e) {
      console.warn('Socket error in chat page:', e);
    }

    return () => {
      if (socket) {
        if (activeSelectedConvId) {
          socket.emit('leave_room', { conversationId: activeSelectedConvId });
          socket.emit('leave_conversation', { conversationId: activeSelectedConvId });
        }
        socket.off('receive_message');
        socket.off('new_message');
        socket.off('conversation_updated');
        socket.off('new_message_notification');
        socket.off('partner_typing');
        socket.off('user_typing');
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeSelectedConvId, userWallet, refetchConversations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeSelectedConvId || !userWallet) return;

    try {
      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit('typing', {
          conversationId: activeSelectedConvId,
          senderWallet: userWallet,
          isTyping: true,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSelectedConvId || !userWallet) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit('typing', {
          conversationId: activeSelectedConvId,
          senderWallet: userWallet,
          isTyping: false,
        });
      }
    } catch {
      // ignore
    }

    const payload = {
      conversationId: activeSelectedConvId,
      senderId: userWallet,
      senderWallet: userWallet,
      content,
      listingId: activeConv?.listingId || activeListing?.id,
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
            void refetchConversations();
          }
        });
      } else {
        const savedMsg = await chatApi.sendMessage(activeSelectedConvId, userWallet, content);
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        requestAnimationFrame(() => scrollToBottom(true));
        void refetchConversations();
      }
    } catch {
      toast.error('Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.');
    }
  };

  if (!mounted || (token && isLoading)) {
    return (
      <div className="h-[calc(100vh-5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
        <div className="h-full rounded-3xl border border-neutral-200/80 bg-white p-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
            <Skeleton className="h-10 w-48 rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-full min-h-[70vh] flex items-center justify-center p-6">
        <EmptyState
          icon={LogIn}
          title="Đăng nhập để xem tin nhắn"
          description="Bạn cần đăng nhập để trao đổi an toàn với người mua và người bán."
          action={{ label: 'Đăng nhập ngay', href: '/auth/login?redirect=/chat' }}
        />
      </div>
    );
  }

  const isMeBuyer = activeConv?.buyerWallet?.toLowerCase() === userWallet.toLowerCase();
  const partnerWallet = isMeBuyer
    ? (activeConv?.sellerWallet ?? '')
    : (activeConv?.buyerWallet ?? activeConv?.sellerWallet ?? '');

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
    <div className="h-[calc(100vh-5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
      <div className="h-full rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden md:grid md:grid-cols-12">
        
        {/* ── Left Pane: Conversation List ── */}
        <div className="h-full border-r border-neutral-200 flex flex-col md:col-span-5 lg:col-span-4 overflow-hidden">
          {/* Header tabs & Search */}
          <div className="p-3 border-b border-neutral-100 space-y-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hidden')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'hidden'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Đã ẩn</span>
                {hiddenConvIds.length > 0 && (
                  <span className="rounded-full bg-neutral-200 px-1.5 py-0.2 text-[10px] font-bold text-neutral-700">
                    {hiddenConvIds.length}
                  </span>
                )}
              </button>
            </div>

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

          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {isConversationsLoading && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </div>
            )}

            {isError && !isConversationsLoading && (
              <div className="p-4">
                <ErrorBanner
                  message={errorMessage}
                  onRetry={() => refetchConversations()}
                />
              </div>
            )}

            {!isConversationsLoading && !isError && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-xs text-neutral-400 space-y-2">
                {activeTab === 'hidden' ? (
                  <>
                    <EyeOff className="h-8 w-8 mx-auto text-neutral-300" />
                    <p className="font-semibold text-neutral-600">Không có cuộc trò chuyện nào bị ẩn</p>
                    <p>Các cuộc trò chuyện đã ẩn sẽ xuất hiện ở đây.</p>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-8 w-8 mx-auto text-neutral-300" />
                    <p className="font-semibold text-neutral-600">Chưa có cuộc trò chuyện nào</p>
                    <p>Khi bạn liên hệ người bán, cuộc trò chuyện sẽ hiển thị tại đây.</p>
                  </>
                )}
              </div>
            )}

            {!isConversationsLoading &&
              !isError &&
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeSelectedConvId;
                const itemIsMeBuyer = conv.buyerWallet.toLowerCase() === userWallet.toLowerCase();
                const itemPartner = itemIsMeBuyer ? conv.sellerWallet : conv.buyerWallet;
                const itemPartnerDisplay =
                  itemPartner.length > 12
                    ? `${itemPartner.slice(0, 6)}...${itemPartner.slice(-4)}`
                    : itemPartner;
                const isHidden = hiddenConvIds.includes(conv.id);

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        router.push(`/chat/${conv.id}`);
                      }
                    }}
                    className={`group relative w-full flex items-center gap-3 rounded-2xl p-3 text-left transition cursor-pointer ${
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
                          {(conv.listingTitle || itemPartnerDisplay || 'K').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                          {conv.listingTitle ?? itemPartnerDisplay}
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

                    {/* Unread badge or hover action */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {(conv.unreadCount ?? 0) > 0 && !isHidden && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}

                      {/* Action button: Hide or Restore */}
                      {isHidden ? (
                        <button
                          type="button"
                          onClick={(e) => restoreConversation(conv.id, e)}
                          title="Bỏ ẩn cuộc trò chuyện"
                          aria-label="Bỏ ẩn cuộc trò chuyện"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => hideConversation(conv.id, e)}
                          title="Ẩn cuộc trò chuyện"
                          aria-label="Ẩn cuộc trò chuyện"
                          className={`opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg transition ${
                            isSelected
                              ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                              : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── Right Pane: Live Message Thread ── */}
        <div className="hidden md:flex md:col-span-7 lg:col-span-8 flex-col h-full overflow-hidden bg-[#fafafa]">
          {activeSelectedConvId && activeConv ? (
            <>
              {/* Pinned Context Header */}
              <div className="bg-white border-b border-neutral-200 p-3.5 flex items-center justify-between gap-3 shadow-2xs shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                    {activeListing?.images?.[0] || activeConv.listingImage ? (
                      <Image
                        src={activeListing?.images?.[0] || activeConv.listingImage!}
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
                      {activeListing?.title || activeConv.listingTitle || partnerName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-neutral-500 font-mono truncate">{partnerName}</span>
                      {formattedPrice && (
                        <span className="text-xs font-extrabold text-emerald-600 font-sans">
                          • {formattedPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Hide Conversation Button */}
                  <button
                    type="button"
                    onClick={(e) => hideConversation(activeConv.id, e)}
                    title="Ẩn cuộc trò chuyện"
                    aria-label="Ẩn cuộc trò chuyện"
                    className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>

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
              </div>

              {/* Message list container with isolated scroll */}
              <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
              >
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
                      Boolean(userWallet) &&
                      (msg.senderWallet.toLowerCase() === userWallet.toLowerCase() ||
                       Boolean(currentUser?.id && msg.senderWallet.toLowerCase() === currentUser.id.toLowerCase()));

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
              </div>

              {/* Message input */}
              <div className="bg-white border-t border-neutral-200 p-3 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
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
    </div>
  );
}


export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-full pb-24 md:pb-12">
          <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
            <div className="h-[calc(100vh-160px)] min-h-125 rounded-3xl border border-neutral-200/80 bg-white p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
        </div>
      }
    >
      <ChatClientContent />
    </Suspense>
  );
}
