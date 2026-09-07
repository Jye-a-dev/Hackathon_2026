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
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.OK)
  getOrCreateConversation(
    @Body('buyerWallet') buyerWallet: string,
    @Body('sellerWallet') sellerWallet: string,
    @Body('listingId') listingId?: string,
  ) {
    return this.chatService.getOrCreateConversation(
      buyerWallet,
      sellerWallet,
      listingId,
    );
  }

  @Get('conversations')
  listUserConversations(@Query('wallet') wallet: string) {
    return this.chatService.listUserConversations(wallet);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getMessages(id, limit, offset);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  postMessage(
    @Param('id') id: string,
    @Body('senderWallet') senderWallet: string,
    @Body('content') content: string,
  ) {
    return this.chatService.saveMessage(id, senderWallet, content);
  }
}
