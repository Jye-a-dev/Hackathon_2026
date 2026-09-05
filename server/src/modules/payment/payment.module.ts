import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { DatabaseModule } from '../../database/database.module';
import { SolanaModule } from '../solana/solana.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [DatabaseModule, SolanaModule, EscrowModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

