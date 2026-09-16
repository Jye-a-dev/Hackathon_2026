import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { SolanaService } from '../solana/solana.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkDeliveredDto } from './dto/mark-delivered.dto';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { QueryEscrowDto } from './dto/query-escrow.dto';

@Controller('escrow')
export class EscrowController {
  constructor(
    private readonly escrowService: EscrowService,
    private readonly solanaService: SolanaService,
  ) {}

  /**
   * System & Blockchain configuration
   */
  @Get('config')
  getConfig() {
    return {
      programId:
        process.env.SOLANA_PROGRAM_ID ||
        'Eh9UPtnvbD3SX7NkNMk9BUKX6marhVMHWhdQ8Gus557a',
      arbiterPublicKey: this.solanaService.getArbiterPublicKey().toBase58(),
      solanaDisabled: this.solanaService.isSolanaDisabled(),
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      wsUrl: process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com',
      defaultTimeoutDuration: parseInt(
        process.env.DEFAULT_TIMEOUT_DURATION || '172800',
        10,
      ),
    };
  }

  /**
   * Compute PDAs for an order
   */
  @Get('pda/:orderId')
  getPda(@Param('orderId') orderId: string) {
    return this.escrowService.calculatePdas(orderId);
  }

  /**
   * Create or register order in PostgreSQL
   */
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateOrderDto) {
    return this.escrowService.createOrder(dto);
  }

  /**
   * List orders with optional filters
   */
  @Get('orders')
  listOrders(@Query() query: QueryEscrowDto) {
    return this.escrowService.listOrders(query);
  }

  /**
   * Get single order details
   */
  @Get('orders/:orderId')
  getOrder(@Param('orderId') orderId: string, @Query('sync') sync?: string) {
    return this.escrowService.getOrder(orderId, sync === 'true');
  }

  /**
   * Mark delivered
   */
  @Post('orders/:orderId/mark-delivered')
  markDelivered(
    @Param('orderId') orderId: string,
    @Body() dto: MarkDeliveredDto,
  ) {
    return this.escrowService.markDelivered(orderId, dto);
  }

  /**
   * Raise dispute
   */
  @Post('orders/:orderId/dispute')
  raiseDispute(
    @Param('orderId') orderId: string,
    @Body() dto: RaiseDisputeDto,
  ) {
    return this.escrowService.raiseDispute(orderId, dto);
  }

  /**
   * Arbiter resolves dispute: Release to Seller OR Refund to Buyer
   */
  @Post('orders/:orderId/resolve')
  resolveDispute(
    @Param('orderId') orderId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.escrowService.resolveDispute(orderId, dto);
  }

  /**
   * Complete escrow
   */
  @Post('orders/:orderId/complete')
  completeOrder(@Param('orderId') orderId: string) {
    return this.escrowService.completeOrder(orderId);
  }

  /**
   * Manually sync on-chain state into PostgreSQL
   */
  @Post('orders/:orderId/sync')
  syncOrder(@Param('orderId') orderId: string) {
    return this.escrowService.syncOrderFromChain(orderId);
  }

  /**
   * Get on-chain events history for an order
   */
  @Get('orders/:orderId/events')
  getEvents(@Param('orderId') orderId: string) {
    return this.escrowService.getEvents(orderId);
  }
}
