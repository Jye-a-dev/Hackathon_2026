import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface UserProfile {
  id: string;
  wallet_address: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  rating_score: number;
  auth_provider: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async findByWallet(walletAddress: string): Promise<UserProfile | null> {
    const res = await this.db.query<UserProfile>(
      'SELECT * FROM users WHERE wallet_address = $1 LIMIT 1;',
      [walletAddress],
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const res = await this.db.query<UserProfile>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1;',
      [id],
    );
    return res.rows[0] || null;
  }

  async upsertUser(data: {
    walletAddress: string;
    email?: string;
    phone?: string;
    fullName?: string;
    avatarUrl?: string;
    authProvider?: string;
    role?: 'BUYER' | 'SELLER' | 'ADMIN';
  }): Promise<UserProfile> {
    const query = `
      INSERT INTO users (
        wallet_address,
        email,
        phone,
        full_name,
        avatar_url,
        auth_provider,
        role,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (wallet_address) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, users.email),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        auth_provider = COALESCE(EXCLUDED.auth_provider, users.auth_provider),
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await this.db.query<UserProfile>(query, [
      data.walletAddress,
      data.email || null,
      data.phone || null,
      data.fullName || null,
      data.avatarUrl || null,
      data.authProvider || 'WALLET',
      data.role || 'BUYER',
    ]);
    return res.rows[0];
  }

  async updateProfile(
    walletAddress: string,
    updates: {
      fullName?: string;
      avatarUrl?: string;
      phone?: string;
      email?: string;
    },
  ): Promise<UserProfile> {
    const query = `
      UPDATE users
      SET full_name = COALESCE($2, full_name),
        avatar_url = COALESCE($3, avatar_url),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *;
    `;
    const res = await this.db.query<UserProfile>(query, [
      walletAddress,
      updates.fullName || null,
      updates.avatarUrl || null,
      updates.phone || null,
      updates.email || null,
    ]);

    if (!res.rows[0]) {
      throw new NotFoundException(`User with wallet ${walletAddress} not found`);
    }
    return res.rows[0];
  }
}

