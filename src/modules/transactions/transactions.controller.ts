import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JWTGuard } from '../../shared/guards/auth.guard';
import { EmailVerifiedGuard } from '../../shared/guards/email-verified.guard';
import { resolveResponse } from '../../shared/resolvers';
import { User } from '../users/entities/user.entity';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JWTGuard, EmailVerifiedGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List user transactions with optional filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated transactions returned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  getUserTransactions(
    @CurrentUser() user: User,
    @Query() query: TransactionQueryDto,
  ) {
    return resolveResponse(
      this.transactionsService.getUserTransactions(user.id, query),
    );
  }
}
