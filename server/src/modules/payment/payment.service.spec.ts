jest.mock('../solana/solana.service', () => ({
  SolanaService: class SolanaService {},
}));
jest.mock('@solana/web3.js', () => ({}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { DatabaseService } from '../../database/database.service';
import { SolanaService } from '../solana/solana.service';
import { EscrowGateway } from '../escrow/escrow.gateway';

describe('PaymentService', () => {
  let service: PaymentService;
  let dbMock: any;
  let solanaMock: any;
  let gatewayMock: any;

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      withTransaction: jest.fn((cb) => cb(dbMock)),
    };
    solanaMock = {
      initializeEscrow: jest.fn().mockResolvedValue('mock_tx_sig_123'),
    };
    gatewayMock = {
      broadcastOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: DatabaseService, useValue: dbMock },
        { provide: SolanaService, useValue: solanaMock },
        { provide: EscrowGateway, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('createPaymentIntent', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      dbMock.query.mockResolvedValueOnce({ rows: [] });
      await expect(
        service.createPaymentIntent({ orderId: '999', amountVnd: 500000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a payment intent with 15m expiration', async () => {
      dbMock.query
        .mockResolvedValueOnce({
          rows: [{ id: '100', buyer_wallet: 'buyer_pubkey' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'pi_test123',
              order_id: '100',
              amount_vnd: '500000',
              locked_sol_price: '3500000',
              amount_lamports: '142857142',
              status: 'PENDING',
              expires_at: new Date(Date.now() + 15 * 60 * 1000),
            },
          ],
        });

      const intent = await service.createPaymentIntent({
        orderId: '100',
        amountVnd: 500000,
      });

      expect(intent).toBeDefined();
      expect(intent.id).toBe('pi_test123');
      expect(intent.status).toBe('PENDING');
    });
  });

  describe('processPaymentWebhook - Idempotency & Guards', () => {
    it('should return 200 OK immediately if webhook was already processed', async () => {
      // Mock finding duplicate in processed_webhooks
      dbMock.query.mockResolvedValueOnce({
        rows: [{ id: 'processed_key_123' }],
      });

      const result = await service.processPaymentWebhook('VIETQR', {
        transactionId: 'TX_DUPLICATE_001',
        orderId: '100',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Idempotent OK');
      expect(solanaMock.initializeEscrow).not.toHaveBeenCalled();
    });

    it('should reject payment if 15-minute intent has expired', async () => {
      // 1. Not duplicate in processed_webhooks
      dbMock.query.mockResolvedValueOnce({ rows: [] });
      // 2. withTransaction -> query returns expired intent
      const expiredDate = new Date(Date.now() - 60 * 1000); // 1 minute in the past
      dbMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'pi_expired',
            order_id: '100',
            expires_at: expiredDate,
            status: 'PENDING',
            locked_sol_price: '3500000',
            max_slippage_bps: 150,
          },
        ],
      });

      await expect(
        service.processPaymentWebhook('VIETQR', {
          transactionId: 'TX_EXPIRED_001',
          orderId: '100',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully execute relayer initialize when valid', async () => {
      // 1. Not duplicate
      dbMock.query.mockResolvedValueOnce({ rows: [] });
      // 2. Valid active intent
      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      dbMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'pi_valid',
            order_id: '100',
            amount_vnd: '500000',
            amount_lamports: '142857142',
            locked_sol_price: '3500000',
            max_slippage_bps: 150,
            expires_at: futureDate,
            status: 'PENDING',
          },
        ],
      });
      // 3. Order details
      dbMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: '100',
            buyer_wallet: 'buyer_wallet_abc',
            seller_wallet: 'seller_wallet_xyz',
          },
        ],
      });
      // 4. Updates
      dbMock.query.mockResolvedValue({ rows: [] });

      const result = await service.processPaymentWebhook('VIETQR', {
        transactionId: 'TX_NEW_001',
        orderId: '100',
      });

      expect(result.success).toBe(true);
      expect(result.txSignature).toBe('mock_tx_sig_123');
      expect(solanaMock.initializeEscrow).toHaveBeenCalledWith(
        '100',
        '142857142',
        'buyer_wallet_abc',
        'seller_wallet_xyz',
      );
    });
  });
});
