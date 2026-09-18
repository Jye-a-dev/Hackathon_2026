import { Injectable, Logger } from '@nestjs/common';
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

export const MOCK_USER: UserProfile = {
  id: '1',
  wallet_address: 'demo_wallet_abc123',
  email: 'mock_user@example.com',
  phone: '0987654321',
  full_name: 'Minh Tuấn (Mock User)',
  avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MinhTuan',
  rating_score: 5.0,
  auth_provider: 'WALLET',
  role: 'BUYER',
  created_at: new Date(),
  updated_at: new Date(),
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async findByWallet(walletAddress: string): Promise<UserProfile | null> {
    if (walletAddress === 'me') {
      return (await this.findById('1')) || MOCK_USER;
    }
    try {
      const res = await this.db.query<UserProfile>(
        'SELECT * FROM users WHERE wallet_address = $1 LIMIT 1;',
        [walletAddress],
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err: any) {
      this.logger.warn(
        `Database query failed in findByWallet (${err.message}). Falling back to mock user.`,
      );
    }

    if (
      walletAddress === 'demo_wallet_abc123' ||
      walletAddress.startsWith('mock_') ||
      walletAddress.startsWith('demo_')
    ) {
      return {
        ...MOCK_USER,
        wallet_address: walletAddress,
      };
    }
    return null;
  }

  async findById(id: string): Promise<UserProfile | null> {
    try {
      const res = await this.db.query<UserProfile>(
        'SELECT * FROM users WHERE id = $1 LIMIT 1;',
        [id],
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err: any) {
      this.logger.warn(
        `Database query failed in findById (${err.message}). Falling back to mock user.`,
      );
    }

    if (id === '1' || id === 'demo' || id === 'mock') {
      return MOCK_USER;
    }
    return null;
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
    try {
      const res = await this.db.query<UserProfile>(query, [
        data.walletAddress,
        data.email || null,
        data.phone || null,
        data.fullName || null,
        data.avatarUrl || null,
        data.authProvider || 'WALLET',
        data.role || 'BUYER',
      ]);
      if (res.rows[0]) return res.rows[0];
    } catch (err: any) {
      this.logger.warn(
        `Database upsertUser failed (${err.message}). Returning fallback mock user profile.`,
      );
    }

    return {
      id: '1',
      wallet_address: data.walletAddress,
      email: data.email || 'mock_user@example.com',
      phone: data.phone || '0987654321',
      full_name: data.fullName || 'Minh Tuấn (Mock User)',
      avatar_url:
        data.avatarUrl ||
        'https://api.dicebear.com/9.x/avataaars/svg?seed=MinhTuan',
      rating_score: 5.0,
      auth_provider: data.authProvider || 'WALLET',
      role: data.role || 'BUYER',
      created_at: new Date(),
      updated_at: new Date(),
    };
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
    try {
      const res = await this.db.query<UserProfile>(query, [
        walletAddress,
        updates.fullName || null,
        updates.avatarUrl || null,
        updates.phone || null,
        updates.email || null,
      ]);
      if (res.rows[0]) return res.rows[0];
    } catch (err: any) {
      this.logger.warn(
        `Database updateProfile failed (${err.message}). Returning updated mock user profile.`,
      );
    }

    return {
      ...MOCK_USER,
      wallet_address: walletAddress,
      full_name: updates.fullName || MOCK_USER.full_name,
      avatar_url: updates.avatarUrl || MOCK_USER.avatar_url,
      phone: updates.phone || MOCK_USER.phone,
      email: updates.email || MOCK_USER.email,
    };
  }
}
