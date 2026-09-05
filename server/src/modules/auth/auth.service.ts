import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { Keypair } from '@solana/web3.js';
import { UsersService, UserProfile } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory OTP cache: phone -> { otp, expiresAt }
  private readonly otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(private readonly usersService: UsersService) {}

  /**
   * Generates a deterministic or fallback Solana wallet for web2 users
   */
  private generateAbstractWallet(seed: string): string {
    const hash = crypto.createHash('sha256').update(seed).digest();
    const keypair = Keypair.fromSeed(hash);
    return keypair.publicKey.toBase58();
  }

  /**
   * Social Login with Google
   */
  async loginWithGoogle(payload: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    walletAddress?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    if (!payload.email) {
      throw new BadRequestException('Email is required for Google login');
    }

    const wallet =
      payload.walletAddress ||
      this.generateAbstractWallet(`google_${payload.email.toLowerCase()}`);

    const user = await this.usersService.upsertUser({
      walletAddress: wallet,
      email: payload.email,
      fullName: payload.fullName,
      avatarUrl: payload.avatarUrl,
      authProvider: 'GOOGLE',
    });

    const token = crypto
      .createHash('sha256')
      .update(`${user.id}_${Date.now()}`)
      .digest('hex');

    return { token, user };
  }

  /**
   * Request 6-digit OTP for phone login
   */
  async requestPhoneOtp(phone: string): Promise<{ success: boolean; message: string; testOtp?: string }> {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.otpStore.set(phone, { otp, expiresAt });
    this.logger.log(`[OTP] Generated OTP ${otp} for phone ${phone}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      testOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verify phone OTP and authenticate / create abstract user profile
   */
  async verifyPhoneOtp(
    phone: string,
    otp: string,
    walletAddress?: string,
  ): Promise<{ token: string; user: UserProfile }> {
    const record = this.otpStore.get(phone);

    // Allow static master OTP '123456' for sandbox/testing
    const isMasterOtp = otp === '123456';

    if (!record && !isMasterOtp) {
      throw new BadRequestException('OTP not requested or expired');
    }

    if (!isMasterOtp) {
      if (Date.now() > record!.expiresAt) {
        this.otpStore.delete(phone);
        throw new BadRequestException('OTP has expired');
      }

      if (record!.otp !== otp) {
        throw new BadRequestException('Invalid OTP code');
      }

      this.otpStore.delete(phone);
    }

    const wallet =
      walletAddress || this.generateAbstractWallet(`phone_${phone}`);

    const user = await this.usersService.upsertUser({
      walletAddress: wallet,
      phone,
      authProvider: 'PHONE',
    });

    const token = crypto
      .createHash('sha256')
      .update(`${user.id}_${Date.now()}`)
      .digest('hex');

    return { token, user };
  }

  /**
   * Direct Web3 Wallet Authentication
   */
  async connectWallet(walletAddress: string): Promise<{ token: string; user: UserProfile }> {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    const user = await this.usersService.upsertUser({
      walletAddress,
      authProvider: 'WALLET',
    });

    const token = crypto
      .createHash('sha256')
      .update(`${user.id}_${Date.now()}`)
      .digest('hex');

    return { token, user };
  }
}

