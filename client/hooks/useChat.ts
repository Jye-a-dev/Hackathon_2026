'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { getChatSocket } from '@/libs/socket';
import { chatApi } from '@/libs/api';
import { normalizeChatMessage } from '@/libs/normalizers';
import type { ChatMessage } from '@/types/chat';

interface UseChatOptions {
  conversationId?: string | null;
  currentUserId?: string | null;
  senderWallet?: string | null;
  initialMessages?: ChatMessage[];
}

export function useChat({
  conversationId,
  currentUserId,
  senderWallet,
  initialMessages = [],
}: UseChatOptions) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial messages when provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Load message history on conversationId switch
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    async function loadMessages() {
      setLoading(true);
      try {
        const history = await chatApi.getMessages(conversationId!);
        if (isSubscribed) {
          setMessages(history);
        }
      } catch (err) {
        console.warn('Error fetching messages for conversation:', conversationId, err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    void loadMessages();
    return () => {
      isSubscribed = false;
    };
  }, [conversationId]);

  // Socket room subscription and real-time event listeners
  useEffect(() => {
    if (!conversationId) return;

    let socket: Socket | null = null;
    try {
      socket = getChatSocket();
      socket.connect();

      // Ensure client joins conversation room immediately
      socket.emit('join_room', { conversationId });
      socket.emit('join_conversation', { conversationId });

      // Append incoming messages without duplicates
      const handleIncomingMessage = (rawMsg: unknown) => {
        const msg = normalizeChatMessage(rawMsg);
        if (String(msg.conversationId) === String(conversationId)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        // Invalidate conversations list so sender/recipient lists update
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      // Real-time conversation update notification handler
      const handleConversationUpdated = (data: { conversationId: string; lastMessage?: unknown }) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        if (data?.lastMessage && String(data.conversationId) === String(conversationId)) {
          const msg = normalizeChatMessage(data.lastMessage);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
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
          String(data.conversationId) === String(conversationId) &&
          data.senderWallet?.toLowerCase() !== (senderWallet || currentUserId || '').toLowerCase()
        ) {
          setIsTyping(data.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
        }
      });
    } catch (e) {
      console.warn('Socket connection error in useChat:', e);
    }

    return () => {
      if (socket) {
        socket.emit('leave_room', { conversationId });
        socket.emit('leave_conversation', { conversationId });
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
  }, [conversationId, currentUserId, senderWallet, queryClient]);

  // Send message helper
  const sendMessage = useCallback(
    async (content: string, listingId?: string): Promise<ChatMessage | null> => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return null;

      const activeSender = senderWallet || currentUserId || 'me';
      const payload = {
        conversationId,
        senderId: currentUserId || activeSender,
        senderWallet: activeSender,
        content: trimmed,
        listingId,
      };

      const socket = getChatSocket();
      if (socket.connected) {
        return new Promise<ChatMessage>((resolve, reject) => {
          socket.emit('send_message', payload, (res: unknown) => {
            if (res) {
              const saved = normalizeChatMessage(res);
              setMessages((prev) => {
                if (prev.some((m) => m.id === saved.id)) return prev;
                return [...prev, saved];
              });
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              resolve(saved);
            } else {
              reject(new Error('Failed to send message via socket'));
            }
          });
        });
      } else {
        const saved = await chatApi.sendMessage(conversationId, activeSender, trimmed);
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        return saved;
      }
    },
    [conversationId, currentUserId, senderWallet, queryClient],
  );

  const sendTyping = useCallback(
    (isTypingState: boolean) => {
      if (!conversationId) return;
      try {
        const socket = getChatSocket();
        if (socket.connected) {
          socket.emit('typing', {
            conversationId,
            senderWallet: senderWallet || currentUserId || '',
            isTyping: isTypingState,
          });
        }
      } catch {
        // ignore
      }
    },
    [conversationId, senderWallet, currentUserId],
  );

  return {
    messages,
    setMessages,
    loading,
    isTyping,
    sendMessage,
    sendTyping,
  };
}

