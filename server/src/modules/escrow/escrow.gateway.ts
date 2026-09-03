import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/escrow',
})
export class EscrowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EscrowGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.orderId) {
      const room = `order:${data.orderId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { event: 'subscribed', orderId: data.orderId };
    }
  }

  @SubscribeMessage('unsubscribe:order')
  handleUnsubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.orderId) {
      const room = `order:${data.orderId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left room ${room}`);
      return { event: 'unsubscribed', orderId: data.orderId };
    }
  }

  /**
   * Broadcast order status update to general room and specific order room
   */
  broadcastOrderStatus(orderId: string, status: string, payload: any) {
    const eventData = {
      orderId,
      status,
      payload,
      timestamp: new Date().toISOString(),
    };
    if (this.server) {
      this.server.to(`order:${orderId}`).emit('escrow:updated', eventData);
      this.server.emit('escrow:global_update', eventData);
      this.logger.log(
        `Broadcasted escrow:updated for order ${orderId} (${status})`,
      );
    }
  }

  /**
   * Broadcast raw on-chain event caught by listener
   */
  broadcastOnChainEvent(
    eventName: string,
    orderId: string,
    data: any,
    signature?: string,
  ) {
    const eventData = {
      eventName,
      orderId,
      data,
      signature,
      timestamp: new Date().toISOString(),
    };
    if (this.server) {
      this.server
        .to(`order:${orderId}`)
        .emit('escrow:onchain_event', eventData);
      this.server.emit('escrow:onchain_event', eventData);
      this.logger.log(
        `Broadcasted on-chain event: ${eventName} for order ${orderId}`,
      );
    }
  }
}
