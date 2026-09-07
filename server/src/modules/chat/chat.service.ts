import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ConversationEntity {
  id: string;
  buyer_wallet: string;
  seller_wallet: string;
  listing_id?: string;
  last_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageEntity {
  id: string;
  conversation_id: string;
  sender_wallet: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Find existing conversation between buyer & seller or create a new one
   */
  async getOrCreateConversation(
    buyerWallet: string,
    sellerWallet: string,
    listingId?: string,
  ): Promise<ConversationEntity> {
    const existing = await this.db.query<ConversationEntity>(
      `SELECT * FROM conversations 
       WHERE (buyer_wallet = $1 AND seller_wallet = $2) 
          OR (buyer_wallet = $2 AND seller_wallet = $1)
       LIMIT 1;`,
      [buyerWallet, sellerWallet],
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const insertQuery = `
      INSERT INTO conversations (buyer_wallet, seller_wallet, listing_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const res = await this.db.query<ConversationEntity>(insertQuery, [
      buyerWallet,
      sellerWallet,
      listingId || null,
    ]);

    return res.rows[0];
  }

  /**
   * List all conversations for a user's wallet
   */
  async listUserConversations(
    walletAddress: string,
  ): Promise<ConversationEntity[]> {
    const query = `
      SELECT c.*, 
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
      FROM conversations c
      WHERE c.buyer_wallet = $1 OR c.seller_wallet = $1
      ORDER BY updated_at DESC;
    `;
    const res = await this.db.query<ConversationEntity>(query, [walletAddress]);
    return res.rows;
  }

  /**
   * Save a new message in conversation
   */
  async saveMessage(
    conversationId: string,
    senderWallet: string,
    content: string,
  ): Promise<MessageEntity> {
    const conv = await this.db.query(
      'SELECT id FROM conversations WHERE id = $1 LIMIT 1;',
      [conversationId],
    );
    if (!conv.rows[0]) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    const query = `
      INSERT INTO messages (conversation_id, sender_wallet, content, is_read, created_at)
      VALUES ($1, $2, $3, FALSE, NOW())
      RETURNING *;
    `;
    const res = await this.db.query<MessageEntity>(query, [
      conversationId,
      senderWallet,
      content,
    ]);

    await this.db.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1;',
      [conversationId],
    );

    return res.rows[0];
  }

  /**
   * Get message history for a conversation
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<MessageEntity[]> {
    const query = `
      SELECT * FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3;
    `;
    const res = await this.db.query<MessageEntity>(query, [
      conversationId,
      Math.min(limit, 100),
      offset,
    ]);
    return res.rows;
  }
}
