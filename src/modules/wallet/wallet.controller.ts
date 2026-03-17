import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JWTGuard } from '../../shared/guards/auth.guard';
import { EmailVerifiedGuard } from '../../shared/guards/email-verified.guard';
import { sendObjectResponse } from '../../shared/resolvers';
import { User } from '../users/entities/user.entity';
import {
  ConvertCurrencyDto,
  FundWalletDto,
  TradeCurrencyDto,
} from './dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JWTGuard, EmailVerifiedGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wallet and balances' })
  @ApiResponse({ status: 200, description: 'Wallet and balances returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getWallet(@CurrentUser() user: User) {
    const data = await this.walletService.getWallet(user.id);
    return sendObjectResponse(data, 'Success');
  }

  @Post('fund')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Fund wallet with a given amount and currency' })
  @ApiResponse({ status: 200, description: 'Wallet funded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async fundWallet(
    @CurrentUser() user: User,
    @Body() dto: FundWalletDto,
  ) {
    const data = await this.walletService.fundWallet(user.id, dto);
    return sendObjectResponse(data, 'Wallet funded successfully');
  }

  @Post('convert')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Convert amount from one currency to another' })
  @ApiResponse({ status: 200, description: 'Currency converted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async convertCurrency(
    @CurrentUser() user: User,
    @Body() dto: ConvertCurrencyDto,
  ) {
    const data = await this.walletService.convertCurrency(user.id, dto);
    return sendObjectResponse(data, 'Currency converted successfully');
  }

  @Post('trade')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buy or sell currency' })
  @ApiResponse({ status: 200, description: 'Trade completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async tradeCurrency(
    @CurrentUser() user: User,
    @Body() dto: TradeCurrencyDto,
  ) {
    const data = await this.walletService.tradeCurrency(user.id, dto);
    return sendObjectResponse(data, 'Trade completed successfully');
  }
}
