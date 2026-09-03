import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { OrdersController } from './orders.controller';
import { ShippingController } from './shipping.controller';
import { AdminDisputesController } from './admin-disputes.controller';
import { EscrowService } from './escrow.service';
import { EscrowRepository } from './repositories/escrow.repository';
import { EscrowGateway } from './escrow.gateway';
import { EscrowSettlementWorker } from './escrow-settlement.worker';

@Module({
  controllers: [
    EscrowController,
    OrdersController,
    ShippingController,
    AdminDisputesController,
  ],
  providers: [
    EscrowService,
    EscrowRepository,
    EscrowGateway,
    EscrowSettlementWorker,
  ],
  exports: [
    EscrowService,
    EscrowRepository,
    EscrowGateway,
    EscrowSettlementWorker,
  ],
})
export class EscrowModule {}
