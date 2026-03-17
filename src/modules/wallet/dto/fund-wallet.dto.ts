import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { Currency } from '../../../constants/fx';

export class FundWalletDto {
  @ApiProperty({ example: 100.5, minimum: 0.01, description: 'Amount to fund' })
  @IsPositive()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: Currency, example: Currency.USD, description: 'Currency of the amount' })
  @IsEnum(Currency)
  currency: Currency;
}
