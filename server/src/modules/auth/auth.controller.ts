import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  loginWithGoogle(
    @Body()
    body: {
      email: string;
      fullName?: string;
      avatarUrl?: string;
      walletAddress?: string;
    },
  ) {
    return this.authService.loginWithGoogle(body);
  }

  @Post('phone/request-otp')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body('phone') phone: string) {
    return this.authService.requestPhoneOtp(phone);
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(
    @Body('phone') phone: string,
    @Body('otp') otp: string,
    @Body('walletAddress') walletAddress?: string,
  ) {
    return this.authService.verifyPhoneOtp(phone, otp, walletAddress);
  }

  @Post('wallet')
  @HttpCode(HttpStatus.OK)
  connectWallet(@Body('walletAddress') walletAddress: string) {
    return this.authService.connectWallet(walletAddress);
  }
}
