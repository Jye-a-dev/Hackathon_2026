import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly escrowService: EscrowService) {}

  /**
   * POST /admin/disputes/:id/resolve
   * Admin / Arbiter resolves dispute: ReleaseToSeller OR RefundToBuyer
   */
  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.escrowService.resolveDispute(id, dto);
  }
}
