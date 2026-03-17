import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxRatesModule } from '../fx-rates/fx-rates.module';
import { Transaction } from '../transactions/entities/transaction.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletBalance, Transaction]),
    FxRatesModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
