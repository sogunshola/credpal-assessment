import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { Currency } from '../../../constants/fx';

export class ConvertCurrencyDto {
  @ApiProperty({ enum: Currency, example: Currency.USD, description: 'Source currency' })
  @IsEnum(Currency)
  fromCurrency: Currency;

  @ApiProperty({ enum: Currency, example: Currency.NGN, description: 'Target currency' })
  @IsEnum(Currency)
  toCurrency: Currency;

  @ApiProperty({ example: 50, minimum: 0.01, description: 'Amount to convert' })
  @IsPositive()
  @IsNumber()
  amount: number;
}
