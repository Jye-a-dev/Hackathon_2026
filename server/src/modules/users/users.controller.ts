import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe() {
    const user =
      (await this.usersService.findById('1')) ||
      (await this.usersService.findByWallet('demo_wallet_abc123'));
    return user || this.usersService.findByWallet('me');
  }

  @Get(':wallet')
  async getProfile(@Param('wallet') wallet: string) {
    if (wallet === 'me') {
      return this.getMe();
    }
    const user = await this.usersService.findByWallet(wallet);
    if (!user) {
      throw new NotFoundException(`User with wallet ${wallet} not found`);
    }
    return user;
  }

  @Patch(':wallet')
  async updateProfile(
    @Param('wallet') wallet: string,
    @Body()
    body: {
      fullName?: string;
      avatarUrl?: string;
      phone?: string;
      email?: string;
    },
  ) {
    return this.usersService.updateProfile(wallet, body);
  }
}
