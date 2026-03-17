import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNumber, IsPositive } from 'class-validator';
import { Currency } from '../../../constants/fx';

const NON_NGN_CURRENCIES = Object.values(Currency).filter((c) => c !== Currency.NGN);

export class TradeCurrencyDto {
  @ApiProperty({ enum: ['buy', 'sell'], example: 'buy', description: 'Trade action' })
  @IsIn(['buy', 'sell'])
  action: 'buy' | 'sell';

  @ApiProperty({ enum: NON_NGN_CURRENCIES, example: Currency.USD, description: 'The non-NGN currency (must not be NGN)' })
  @IsEnum(Currency)
  @IsIn(NON_NGN_CURRENCIES, { message: 'currency must not be NGN for trade' })
  currency: Currency;

  @ApiProperty({ example: 100, minimum: 0.01, description: 'Trade amount' })
  @IsPositive()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: Currency, example: Currency.NGN, description: 'Which side the amount is denominated in' })
  @IsEnum(Currency)
  amountCurrency: Currency;
}
