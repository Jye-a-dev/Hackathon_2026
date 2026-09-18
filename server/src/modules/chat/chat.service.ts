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
       WHERE ((LOWER(buyer_wallet) = LOWER($1) AND LOWER(seller_wallet) = LOWER($2)) 
           OR (LOWER(buyer_wallet) = LOWER($2) AND LOWER(seller_wallet) = LOWER($1)))
         AND ($3::bigint IS NULL OR listing_id = $3::bigint)
       LIMIT 1;`,
      [buyerWallet, sellerWallet, listingId ? Number(listingId) : null],
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    // Fallback search without listingId filter if not found
    const existingAny = await this.db.query<ConversationEntity>(
      `SELECT * FROM conversations 
       WHERE (LOWER(buyer_wallet) = LOWER($1) AND LOWER(seller_wallet) = LOWER($2)) 
          OR (LOWER(buyer_wallet) = LOWER($2) AND LOWER(seller_wallet) = LOWER($1))
       LIMIT 1;`,
      [buyerWallet, sellerWallet],
    );

    if (existingAny.rows[0]) {
      if (listingId && !existingAny.rows[0].listing_id) {
        await this.db.query(
          'UPDATE conversations SET listing_id = $1, updated_at = NOW() WHERE id = $2;',
          [Number(listingId), existingAny.rows[0].id],
        );
        existingAny.rows[0].listing_id = listingId;
      }
      return existingAny.rows[0];
    }

    const insertQuery = `
      INSERT INTO conversations (buyer_wallet, seller_wallet, listing_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const res = await this.db.query<ConversationEntity>(insertQuery, [
      buyerWallet,
      sellerWallet,
      listingId ? Number(listingId) : null,
    ]);

    return res.rows[0];
  }

  /**
   * List all conversations for a user's wallet
   */
  async listUserConversations(
    walletAddress: string,
  ): Promise<ConversationEntity[]> {
    if (!walletAddress || walletAddress === 'me') {
      return [];
    }
    const query = `
      SELECT c.*, 
        l.title AS listing_title,
        l.price_vnd AS listing_price,
        (SELECT images[1] FROM listings WHERE id = c.listing_id) AS listing_image,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
      FROM conversations c
      LEFT JOIN listings l ON l.id = c.listing_id
      WHERE LOWER(c.buyer_wallet) = LOWER($1)
         OR LOWER(c.seller_wallet) = LOWER($1)
         OR c.buyer_wallet IN (SELECT wallet_address FROM users WHERE id::text = $1)
         OR c.seller_wallet IN (SELECT wallet_address FROM users WHERE id::text = $1)
         OR c.buyer_wallet IN (SELECT id::text FROM users WHERE LOWER(wallet_address) = LOWER($1))
         OR c.seller_wallet IN (SELECT id::text FROM users WHERE LOWER(wallet_address) = LOWER($1))
      ORDER BY c.updated_at DESC;
    `;
    const res = await this.db.query<ConversationEntity>(query, [walletAddress]);
    return res.rows;
  }

  /**
   * Save a message and resolve recipient identification for targeted notifications
   */
  async saveMessageWithParticipants(
    conversationId: string,
    sender: string,
    content: string,
  ): Promise<{
    savedMessage: MessageEntity;
    recipientId?: string;
    recipientWallet?: string;
  }> {
    const conv = await this.db.query<ConversationEntity>(
      'SELECT * FROM conversations WHERE id = $1 LIMIT 1;',
      [conversationId],
    );
    if (!conv.rows[0]) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    const conversation = conv.rows[0];

    // Determine recipient wallet based on sender
    const isSenderBuyer =
      conversation.buyer_wallet.toLowerCase() === sender.toLowerCase();
    const recipientWallet = isSenderBuyer
      ? conversation.seller_wallet
      : conversation.buyer_wallet;

    let recipientId: string | undefined;
    try {
      const userRes = await this.db.query<{ id: string }>(
        'SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($1) OR id::text = $1 LIMIT 1;',
        [recipientWallet],
      );
      if (userRes.rows[0]) {
        recipientId = String(userRes.rows[0].id);
      }
    } catch {
      // ignore
    }

    // Persist message in PostgreSQL database (messages table)
    const query = `
      INSERT INTO messages (conversation_id, sender_wallet, content, is_read, created_at)
      VALUES ($1, $2, $3, FALSE, NOW())
      RETURNING *;
    `;
    const res = await this.db.query<MessageEntity>(query, [
      conversationId,
      sender,
      content,
    ]);

    await this.db.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1;',
      [conversationId],
    );

    return {
      savedMessage: res.rows[0],
      recipientId,
      recipientWallet,
    };
  }

  /**
   * Save a new message in conversation
   */
  async saveMessage(
    conversationId: string,
    senderWallet: string,
    content: string,
  ): Promise<MessageEntity> {
    const { savedMessage } = await this.saveMessageWithParticipants(
      conversationId,
      senderWallet,
      content,
    );
    return savedMessage;
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
