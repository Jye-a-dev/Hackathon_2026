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
import { CreateOrderDto } from './dto/create-order.dto';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { MarkDeliveredDto } from './dto/mark-delivered.dto';
import { QueryEscrowDto } from './dto/query-escrow.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly escrowService: EscrowService) {}

  /**
   * POST /orders
   * Create or register order in database
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateOrderDto) {
    return this.escrowService.createOrder(dto);
  }

  /**
   * GET /orders
   * List orders with optional filters
   */
  @Get()
  listOrders(@Query() query: QueryEscrowDto) {
    return this.escrowService.listOrders(query);
  }

  /**
   * GET /orders/:id
   * Get single order details
   */
  @Get(':id')
  getOrder(@Param('id') id: string, @Query('sync') sync?: string) {
    return this.escrowService.getOrder(id, sync === 'true');
  }

  /**
   * POST /orders/:id/dispute
   * Buyer files a dispute within 48h window
   */
  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  raiseDispute(@Param('id') id: string, @Body() dto: RaiseDisputeDto) {
    return this.escrowService.raiseDispute(id, dto);
  }

  /**
   * POST /orders/:id/mark-delivered
   * Arbiter or seller marks delivered
   */
  @Post(':id/mark-delivered')
  markDelivered(@Param('id') id: string, @Body() dto?: MarkDeliveredDto) {
    return this.escrowService.markDelivered(id, dto);
  }

  /**
   * POST /orders/:id/complete
   * Complete escrow (release funds to seller)
   */
  @Post(':id/complete')
  completeOrder(@Param('id') id: string) {
    return this.escrowService.completeOrder(id);
  }

  /**
   * POST /orders/:id/cancel
   * Buyer or Admin cancels order while LOCKED and triggers refund
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelOrder(@Param('id') id: string, @Body() dto?: any) {
    return this.escrowService.cancelOrder(id, dto);
  }

  /**
   * POST /orders/:id/dispute/evidence
   * Upload and attach evidence for a dispute
   */
  @Post(':id/dispute/evidence')
  @HttpCode(HttpStatus.OK)
  submitEvidence(@Param('id') id: string, @Body() dto: any) {
    return this.escrowService.submitEvidence(id, dto);
  }
}
