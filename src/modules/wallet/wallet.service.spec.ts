jest.mock('../../config/env.config', () => ({
  default: { fxRatesCacheTtl: 300, fxBaseUrl: 'https://api.example.com', fxApiKey: 'key' },
}));

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Currency, TransactionStatus, TransactionType } from '../../constants/fx';
import { FxRatesService } from '../fx-rates/fx-rates.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { WalletService } from './wallet.service';
import { ConvertCurrencyDto, FundWalletDto, TradeCurrencyDto } from './dto';

describe('WalletService', () => {
  let service: WalletService;
  let mockQueryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      getRepository: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };
  };
  let mockFxRatesService: { getRate: jest.Mock };

  const createMockManager = (overrides?: {
    balanceFindOne?: WalletBalance | null;
    toBalanceFindOne?: WalletBalance | null;
    queryBuilderGetOne?: WalletBalance | null;
  }) => {
    const balanceRepo = {
      findOne: jest.fn(),
      create: jest.fn((attrs: Partial<WalletBalance>) => ({ ...attrs })),
      save: jest.fn((_entityType: unknown, entity: WalletBalance) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn(() => ({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overrides?.queryBuilderGetOne ?? null),
      })),
    };

    let findOneCallCount = 0;
    balanceRepo.findOne.mockImplementation(() => {
      findOneCallCount++;
      if (findOneCallCount === 1) {
        return Promise.resolve(overrides?.balanceFindOne ?? null);
      }
      return Promise.resolve(overrides?.toBalanceFindOne ?? null);
    });

    const manager = {
      getRepository: jest.fn(() => balanceRepo),
      create: jest.fn((_entity: unknown, attrs: Record<string, unknown>) => ({ ...attrs })),
      save: jest.fn((_entityType: unknown, entity: unknown) => Promise.resolve(entity)),
    };

    return { manager, balanceRepo };
  };

  beforeEach(async () => {
    mockFxRatesService = { getRate: jest.fn() };

    const { manager, balanceRepo } = createMockManager();
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager,
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      getRepository: jest.fn(() => balanceRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: FxRatesService, useValue: mockFxRatesService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  describe('fundWallet', () => {
    it('should increase balance by the funded amount', async () => {
      const userId = 'user-1';
      const existingBalance: WalletBalance = {
        id: 'wb-1',
        userId,
        currency: Currency.USD,
        balance: '100.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const { balanceRepo } = createMockManager({ balanceFindOne: existingBalance });
      mockQueryRunner.manager.getRepository.mockReturnValue(balanceRepo);

      const dto: FundWalletDto = { amount: 50.5, currency: Currency.USD };
      await service.fundWallet(userId, dto);

      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '150.50000000',
          currency: Currency.USD,
          userId,
        }),
      );
    });

    it('should create a COMPLETED FUNDING transaction', async () => {
      const userId = 'user-1';
      const existingBalance: WalletBalance = {
        id: 'wb-1',
        userId,
        currency: Currency.EUR,
        balance: '0.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const { balanceRepo } = createMockManager({ balanceFindOne: existingBalance });
      mockQueryRunner.manager.getRepository.mockReturnValue(balanceRepo);

      const dto: FundWalletDto = { amount: 100, currency: Currency.EUR };
      const tx = await service.fundWallet(userId, dto);

      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({
          userId,
          type: TransactionType.FUNDING,
          status: TransactionStatus.COMPLETED,
          fromCurrency: null,
          toCurrency: Currency.EUR,
          fromAmount: null,
          toAmount: '100.00000000',
          rate: null,
        }),
      );
      expect(tx.type).toBe(TransactionType.FUNDING);
      expect(tx.status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('convertCurrency', () => {
    it('should deduct fromCurrency and credit toCurrency using fetched rate', async () => {
      const userId = 'user-1';
      const rate = 0.92;
      mockFxRatesService.getRate.mockResolvedValue(rate);

      const fromBalance: WalletBalance = {
        id: 'from-1',
        userId,
        currency: Currency.USD,
        balance: '100.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const toBalance: WalletBalance = {
        id: 'to-1',
        userId,
        currency: Currency.EUR,
        balance: '0.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const balanceRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(toBalance),
        create: jest.fn((attrs: Partial<WalletBalance>) => ({ ...attrs })),
        save: jest.fn((_entityType: unknown, entity: WalletBalance) => Promise.resolve(entity)),
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(fromBalance),
        })),
      };

      mockQueryRunner.manager.getRepository.mockReturnValue(balanceRepo);

      const dto: ConvertCurrencyDto = {
        fromCurrency: Currency.USD,
        toCurrency: Currency.EUR,
        amount: 10,
      };

      await service.convertCurrency(userId, dto);

      expect(mockFxRatesService.getRate).toHaveBeenCalledWith(Currency.USD, Currency.EUR);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '90.00000000',
          currency: Currency.USD,
        }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '9.20000000',
          currency: Currency.EUR,
        }),
      );
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      const userId = 'user-1';
      const fromBalance: WalletBalance = {
        id: 'from-1',
        userId,
        currency: Currency.USD,
        balance: '5.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const balanceRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(fromBalance),
        })),
      };

      mockQueryRunner.manager.getRepository.mockReturnValue(balanceRepo);

      const dto: ConvertCurrencyDto = {
        fromCurrency: Currency.USD,
        toCurrency: Currency.EUR,
        amount: 10,
      };

      await expect(service.convertCurrency(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.convertCurrency(userId, dto)).rejects.toThrow(
        /Insufficient USD balance/,
      );
      expect(mockFxRatesService.getRate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when fromCurrency === toCurrency', async () => {
      const userId = 'user-1';
      const dto: ConvertCurrencyDto = {
        fromCurrency: Currency.USD,
        toCurrency: Currency.USD,
        amount: 10,
      };

      await expect(service.convertCurrency(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.convertCurrency(userId, dto)).rejects.toThrow(
        'fromCurrency and toCurrency must differ',
      );
      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
    });
  });

  describe('tradeCurrency', () => {
    it('(buy) should convert NGN → target currency', async () => {
      const userId = 'user-1';
      const rate = 0.002; // NGN -> USD
      mockFxRatesService.getRate.mockResolvedValue(rate);

      const ngnBalance: WalletBalance = {
        id: 'ngn-1',
        userId,
        currency: Currency.NGN,
        balance: '100000.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const usdBalance: WalletBalance = {
        id: 'usd-1',
        userId,
        currency: Currency.USD,
        balance: '0.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      let getOneCallCount = 0;
      const balanceRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(usdBalance),
        create: jest.fn((attrs: Partial<WalletBalance>) => ({ ...attrs })),
        save: jest.fn((_entityType: unknown, entity: WalletBalance) => Promise.resolve(entity)),
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockImplementation(() => {
            getOneCallCount++;
            return Promise.resolve(getOneCallCount === 1 ? ngnBalance : null);
          }),
        })),
      };

      mockQueryRunner.manager.getRepository.mockReturnValue(balanceRepo);

      const dto: TradeCurrencyDto = {
        action: 'buy',
        currency: Currency.USD,
        amount: 50000,
        amountCurrency: Currency.NGN,
      };

      await service.tradeCurrency(userId, dto);

      expect(mockFxRatesService.getRate).toHaveBeenCalledWith(Currency.NGN, Currency.USD);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '50000.00000000',
          currency: Currency.NGN,
        }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '100.00000000',
          currency: Currency.USD,
        }),
      );
    });

    it('(sell) should convert target currency → NGN', async () => {
      const userId = 'user-1';
      const rate = 500; // USD -> NGN
      mockFxRatesService.getRate.mockResolvedValue(rate);

      const usdBalance: WalletBalance = {
        id: 'usd-1',
        userId,
        currency: Currency.USD,
        balance: '20.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      const ngnBalance: WalletBalance = {
        id: 'ngn-1',
        userId,
        currency: Currency.NGN,
        balance: '0.00000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WalletBalance;

      let getOneCallCount = 0;
      const balanceRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(ngnBalance),
        create: jest.fn((attrs: Partial<WalletBalance>) => ({ ...attrs })),
        save: jest.fn((_entityType: unknown, entity: WalletBalance) => Promise.resolve(entity)),
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockImplementation(() => {
            getOneCallCount++;
            return Promise.resolve(getOneCallCount === 1 ? usdBalance : null);
          }),
        })),
      };

      mockQueryRunner.manager.getRepository.mockReturnValue(balanceRepo);

      const dto: TradeCurrencyDto = {
        action: 'sell',
        currency: Currency.USD,
        amount: 10,
        amountCurrency: Currency.USD,
      };

      await service.tradeCurrency(userId, dto);

      expect(mockFxRatesService.getRate).toHaveBeenCalledWith(Currency.USD, Currency.NGN);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '10.00000000',
          currency: Currency.USD,
        }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        WalletBalance,
        expect.objectContaining({
          balance: '5000.00000000',
          currency: Currency.NGN,
        }),
      );
    });

    it('should throw BadRequestException when currency === NGN', async () => {
      const userId = 'user-1';
      const dto: TradeCurrencyDto = {
        action: 'buy',
        currency: Currency.NGN,
        amount: 100,
        amountCurrency: Currency.NGN,
      };

      await expect(service.tradeCurrency(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.tradeCurrency(userId, dto)).rejects.toThrow(
        'currency must not be NGN for trade',
      );
      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
    });
  });
});
