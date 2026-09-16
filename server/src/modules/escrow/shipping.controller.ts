import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { ShippingWebhookDto } from './dto/shipping-webhook.dto';

@Controller('shipping')
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(private readonly escrowService: EscrowService) {}

  /**
   * POST /shipping/webhook
   * Simulates/Receives webhook from delivery partner (GHN/J&T).
   * When delivery status is DELIVERED, automatically invokes escrowService.markDelivered(orderId).
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: ShippingWebhookDto) {
    this.logger.log(`Received shipping webhook: ${JSON.stringify(payload)}`);

    const raw = payload as Record<string, any>;

    // Parse tracking code from GHN / J&T / custom payloads
    const trackingCode: string | undefined =
      payload.trackingCode ||
      raw.tracking_code ||
      raw.OrderCode ||
      raw.order_code ||
      raw.billcode;

    // Parse status from standard or delivery partner formats
    const rawStatus = (
      payload.status ||
      raw.Status ||
      raw.scanstatus ||
      raw.shipping_status ||
      ''
    )
      .toString()
      .toUpperCase();

    // Check if delivery is confirmed
    const isDelivered =
      rawStatus === 'DELIVERED' ||
      rawStatus === 'SUCCESS' ||
      rawStatus === 'DELIVERY_SUCCESS' ||
      rawStatus === 'HOAN_THANH' ||
      rawStatus === 'GIAO_THANH_CONG';

    if (!isDelivered) {
      return {
        success: true,
        message: `Webhook received with status [${rawStatus}]. No escrow state transition required.`,
      };
    }

    // Resolve orderId from explicit field or tracking code lookup
    let targetOrderId: string | number | undefined =
      payload.orderId || raw.order_id;
    if (!targetOrderId && trackingCode) {
      const order = await this.escrowService.findByTrackingCode(trackingCode);
      if (order) {
        targetOrderId = order.order_id || order.id;
      }
    }

    if (!targetOrderId) {
      throw new BadRequestException(
        'Unable to correlate webhook with an order. Please supply "orderId" or a valid "trackingCode".',
      );
    }

    const orderIdStr = String(targetOrderId);

    // Idempotency check: check if order is already DELIVERED or beyond
    const existingOrder = await this.escrowService.getOrder(orderIdStr);
    const currentStatus = existingOrder?.db?.status;
    if (currentStatus && currentStatus !== 'LOCKED') {
      this.logger.log(
        `Order ${orderIdStr} is already in status [${currentStatus}]. Skipping redundant markDelivered execution.`,
      );
      return {
        success: true,
        orderId: orderIdStr,
        status: currentStatus,
        message: 'Order already processed (idempotent duplicate).',
      };
    }

    this.logger.log(
      `Invoking escrowService.markDelivered for orderId: ${orderIdStr}`,
    );
    const result = await this.escrowService.markDelivered(orderIdStr);

    return {
      success: true,
      orderId: orderIdStr,
      status: 'DELIVERED',
      txSignature: result.txSignature,
    };
  }
}
