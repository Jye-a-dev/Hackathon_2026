import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth || {};
      const token = auth.token;
      let user: { id: string; wallet?: string } | null = null;

      // Authenticate JWT payload if token follows header.payload.signature structure
      if (token && typeof token === 'string' && token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString('utf8'),
            );
            const id = payload.sub || payload.userId || payload.id;
            if (id) {
              user = {
                id: String(id),
                wallet: payload.wallet || payload.walletAddress,
              };
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to parse JWT payload: ${e}`);
        }
      }

      // Handshake auth fallback: resolve user ID / wallet from client connection
      if (!user) {
        const fallbackId = auth.userId || auth.id;
        const fallbackWallet = auth.wallet || auth.walletAddress;
        if (fallbackId) {
          user = { id: String(fallbackId), wallet: fallbackWallet };
        } else if (fallbackWallet) {
          try {
            const dbUser = await this.usersService.findByWallet(fallbackWallet);
            user = {
              id: String(dbUser?.id || fallbackWallet),
              wallet: fallbackWallet,
            };
          } catch {
            user = { id: String(fallbackWallet), wallet: fallbackWallet };
          }
        }
      }

      // Join socket to private user personal room: user_${user.id}
      if (user) {
        client.join(`user_${user.id}`);
        if (user.wallet && user.wallet !== user.id) {
          client.join(`user_${user.wallet}`);
        }
        this.logger.log(
          `Chat client ${client.id} joined private room user_${user.id}`,
        );
      }

      this.logger.log(
        `Chat client connected: ${client.id} (user: ${user ? user.id : 'anonymous'})`,
      );
    } catch (err: any) {
      this.logger.error(`Error in handleConnection: ${err?.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  @SubscribeMessage('join_conversation')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const conversationId = String(data.conversationId);
    client.join(`conversation_${conversationId}`);
    client.join(`conv_${conversationId}`);
    client.join(conversationId);
    this.logger.log(`Client ${client.id} joined room conversation_${conversationId}`);
    return { event: 'joined', conversationId };
  }

  @SubscribeMessage('leave_room')
  @SubscribeMessage('leave_conversation')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const conversationId = String(data.conversationId);
    client.leave(`conversation_${conversationId}`);
    client.leave(`conv_${conversationId}`);
    client.leave(conversationId);
    this.logger.log(`Client ${client.id} left room conversation_${conversationId}`);
    return { event: 'left', conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      senderWallet?: string;
      senderId?: string;
      content: string;
      listingId?: string;
    },
  ) {
    const conversationId = String(data.conversationId);
    const sender = data.senderWallet || data.senderId || 'unknown';

    // Persist message in PostgreSQL database (messages table)
    const { savedMessage, recipientId, recipientWallet } =
      await this.chatService.saveMessageWithParticipants(
        conversationId,
        sender,
        data.content,
      );

    // Emit receive_message to specific conversation room
    this.server
      .to(`conversation_${conversationId}`)
      .to(`conv_${conversationId}`)
      .to(conversationId)
      .emit('receive_message', savedMessage);

    // Support legacy new_message listener
    this.server
      .to(`conversation_${conversationId}`)
      .to(`conv_${conversationId}`)
      .to(conversationId)
      .emit('new_message', savedMessage);

    // ALSO emit conversation_updated and new_message_notification directly to recipient's personal room
    const notificationPayload = {
      conversationId,
      lastMessage: savedMessage,
    };

    if (recipientId) {
      this.server
        .to(`user_${recipientId}`)
        .emit('conversation_updated', notificationPayload);
      this.server
        .to(`user_${recipientId}`)
        .emit('new_message_notification', notificationPayload);
    }
    if (recipientWallet && recipientWallet !== recipientId) {
      this.server
        .to(`user_${recipientWallet}`)
        .emit('conversation_updated', notificationPayload);
      this.server
        .to(`user_${recipientWallet}`)
        .emit('new_message_notification', notificationPayload);
    }

    // Also notify sender's personal room to keep multiple sender tabs/devices in sync
    if (data.senderId) {
      this.server
        .to(`user_${data.senderId}`)
        .emit('conversation_updated', notificationPayload);
    }
    if (data.senderWallet && data.senderWallet !== data.senderId) {
      this.server
        .to(`user_${data.senderWallet}`)
        .emit('conversation_updated', notificationPayload);
    }

    return savedMessage;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; senderWallet: string; isTyping: boolean },
  ) {
    const conversationId = String(data.conversationId);
    client
      .to(`conversation_${conversationId}`)
      .to(`conv_${conversationId}`)
      .to(conversationId)
      .emit('user_typing', data);
    client
      .to(`conversation_${conversationId}`)
      .to(`conv_${conversationId}`)
      .to(conversationId)
      .emit('partner_typing', data);
  }
}
