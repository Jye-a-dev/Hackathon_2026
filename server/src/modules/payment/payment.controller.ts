import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/payment-intent.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /payments/intent
   * Generate VietQR / MoMo payment intent for an order with locked rate
   */
  @Post('intent')
  @HttpCode(HttpStatus.CREATED)
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createPaymentIntent(dto);
  }

  /**
   * GET /payments/intent/:id
   * Fetch payment intent status and QR image URL
   */
  @Get('intent/:id')
  getPaymentIntent(@Param('id') id: string) {
    return this.paymentService.getPaymentIntent(id);
  }

  /**
   * POST /payments/webhook/vietqr
   * Bank / VietQR webhook endpoint
   */
  @Post('webhook/vietqr')
  @HttpCode(HttpStatus.OK)
  handleVietQrWebhook(@Body() payload: Record<string, any>) {
    return this.paymentService.processPaymentWebhook('VIETQR', payload);
  }

  /**
   * POST /payments/webhook/momo
   * MoMo IPN webhook endpoint
   */
  @Post('webhook/momo')
  @HttpCode(HttpStatus.OK)
  handleMomoWebhook(@Body() payload: Record<string, any>) {
    return this.paymentService.processPaymentWebhook('MOMO', payload);
  }
}
