import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import Decimal from 'decimal.js';
import { Currency, TransactionStatus, TransactionType } from '../../constants/fx';
import { FxRatesService } from '../fx-rates/fx-rates.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import {
  ConvertCurrencyDto,
  FundWalletDto,
  TradeCurrencyDto,
} from './dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fxRatesService: FxRatesService,
  ) {}

  async getOrCreateBalance(
    userId: string,
    currency: Currency,
    manager?: EntityManager,
  ): Promise<WalletBalance> {
    const repo = manager
      ? manager.getRepository(WalletBalance)
      : this.dataSource.getRepository(WalletBalance);

    let balance = await repo.findOne({
      where: { userId, currency },
    });

    if (!balance) {
      balance = repo.create({
        userId,
        currency,
        balance: '0',
      });
      await repo.save(balance);
    }

    return balance;
  }

  async getWallet(userId: string): Promise<WalletBalance[]> {
    const repo = this.dataSource.getRepository(WalletBalance);
    return repo.find({
      where: { userId },
      order: { currency: 'ASC' },
    });
  }

  async fundWallet(userId: string, dto: FundWalletDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const balance = await this.getOrCreateBalance(userId, dto.currency, manager);

      const newBalance = new Decimal(balance.balance)
        .plus(dto.amount)
        .toFixed(8);

      balance.balance = newBalance;
      await manager.save(WalletBalance, balance);

      const amountStr = new Decimal(dto.amount).toFixed(8);
      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.FUNDING,
        status: TransactionStatus.COMPLETED,
        fromCurrency: null,
        toCurrency: dto.currency,
        fromAmount: null,
        toAmount: amountStr,
        rate: null,
        description: null,
        reference: Transaction.createReference(),
        metadata: null,
      });
      await manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return transaction;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async convertCurrency(
    userId: string,
    dto: ConvertCurrencyDto,
  ): Promise<Transaction> {
    if (dto.fromCurrency === dto.toCurrency) {
      throw new BadRequestException('fromCurrency and toCurrency must differ');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const fromBalance = await manager
        .getRepository(WalletBalance)
        .createQueryBuilder('wb')
        .setLock('pessimistic_write')
        .where('wb.userId = :userId', { userId })
        .andWhere('wb.currency = :currency', { currency: dto.fromCurrency })
        .getOne();

      if (!fromBalance) {
        throw new BadRequestException(
          `Insufficient ${dto.fromCurrency} balance`,
        );
      }

      const currentBalance = new Decimal(fromBalance.balance);
      const fromAmount = new Decimal(dto.amount);
      if (currentBalance.lt(fromAmount)) {
        throw new BadRequestException(
          `Insufficient ${dto.fromCurrency} balance`,
        );
      }

      const rate = await this.fxRatesService.getRate(
        dto.fromCurrency,
        dto.toCurrency,
      );
      const toAmount = fromAmount.mul(rate).toDecimalPlaces(8);

      fromBalance.balance = currentBalance.minus(fromAmount).toFixed(8);
      await manager.save(WalletBalance, fromBalance);

      const toBalance = await this.getOrCreateBalance(
        userId,
        dto.toCurrency,
        manager,
      );
      toBalance.balance = new Decimal(toBalance.balance)
        .plus(toAmount)
        .toFixed(8);
      await manager.save(WalletBalance, toBalance);

      const fromAmountStr = fromAmount.toFixed(8);
      const toAmountStr = toAmount.toFixed(8);
      const rateStr = new Decimal(rate).toFixed(8);
      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.CONVERSION,
        status: TransactionStatus.COMPLETED,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        fromAmount: fromAmountStr,
        toAmount: toAmountStr,
        rate: rateStr,
        description: null,
        reference: Transaction.createReference(),
        metadata: {
          rateSnapshot: {
            [dto.fromCurrency]: { [dto.toCurrency]: rate },
          },
        },
      });
      await manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return transaction;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async tradeCurrency(userId: string, dto: TradeCurrencyDto): Promise<Transaction> {
    if (dto.currency === Currency.NGN) {
      throw new BadRequestException('currency must not be NGN for trade');
    }

    const fromCurrency = dto.action === 'buy' ? Currency.NGN : dto.currency;
    const toCurrency = dto.action === 'buy' ? dto.currency : Currency.NGN;

    let amount = new Decimal(dto.amount);
    if (dto.amountCurrency === toCurrency) {
      const rate = await this.fxRatesService.getRate(fromCurrency, toCurrency);
      amount = amount.div(rate).toDecimalPlaces(8);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const fromBalance = await manager
        .getRepository(WalletBalance)
        .createQueryBuilder('wb')
        .setLock('pessimistic_write')
        .where('wb.userId = :userId', { userId })
        .andWhere('wb.currency = :currency', { currency: fromCurrency })
        .getOne();

      if (!fromBalance) {
        throw new BadRequestException(
          `Insufficient ${fromCurrency} balance`,
        );
      }

      const currentBalance = new Decimal(fromBalance.balance);
      if (currentBalance.lt(amount)) {
        throw new BadRequestException(
          `Insufficient ${fromCurrency} balance`,
        );
      }

      const rate = await this.fxRatesService.getRate(fromCurrency, toCurrency);
      const toAmount = amount.mul(rate).toDecimalPlaces(8);

      fromBalance.balance = currentBalance.minus(amount).toFixed(8);
      await manager.save(WalletBalance, fromBalance);

      const toBalance = await this.getOrCreateBalance(
        userId,
        toCurrency,
        manager,
      );
      toBalance.balance = new Decimal(toBalance.balance)
        .plus(toAmount)
        .toFixed(8);
      await manager.save(WalletBalance, toBalance);

      const fromAmountStr = amount.toFixed(8);
      const toAmountStr = toAmount.toFixed(8);
      const rateStr = new Decimal(rate).toFixed(8);
      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.TRADE,
        status: TransactionStatus.COMPLETED,
        fromCurrency,
        toCurrency,
        fromAmount: fromAmountStr,
        toAmount: toAmountStr,
        rate: rateStr,
        description: null,
        reference: Transaction.createReference(),
        metadata: {
          rateSnapshot: {
            [fromCurrency]: { [toCurrency]: rate },
          },
        },
      });
      await manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return transaction;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
