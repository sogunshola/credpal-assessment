import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JWTGuard } from '../../shared/guards/auth.guard';
import { EmailVerifiedGuard } from '../../shared/guards/email-verified.guard';
import { resolveResponse, sendObjectResponse } from '../../shared/resolvers';
import { FxRatesService } from './fx-rates.service';

@ApiTags('fx-rates')
@ApiBearerAuth()
@UseGuards(JWTGuard, EmailVerifiedGuard)
@Controller('fx')
export class FxRatesController {
  constructor(private readonly fxRatesService: FxRatesService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get supported FX rates' })
  @ApiResponse({ status: 200, description: 'FX rates returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getRates() {
    const rates = await this.fxRatesService.getSupportedRates();
    return sendObjectResponse(rates, 'Success');
  }
}
