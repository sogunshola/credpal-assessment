import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { CacheService } from '../cache/cache.service';
import { FxRatesService } from './fx-rates.service';
import { Currency } from '../../constants/fx';

jest.mock('../../config/env.config', () => ({
  default: { fxRatesCacheTtl: 300, fxBaseUrl: 'https://api.example.com', fxApiKey: 'key' },
}));

jest.mock('../../config/winston', () => ({
  logger: { error: jest.fn() },
}));

describe('FxRatesService', () => {
  let service: FxRatesService;
  let mockHttpService: { get: jest.Mock };
  let mockCacheService: { getOrSet: jest.Mock };

  beforeEach(async () => {
    mockHttpService = { get: jest.fn() };
    mockCacheService = { getOrSet: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxRatesService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<FxRatesService>(FxRatesService);
  });

  describe('getRates', () => {
    it('should return cached rates when cache hit', async () => {
      const cachedRates = { NGN: 1, USD: 0.002, EUR: 0.0018 };
      mockCacheService.getOrSet.mockResolvedValue(cachedRates);

      const result = await service.getRates(Currency.NGN);

      expect(result).toEqual(cachedRates);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'fx:rates:latest:NGN',
        expect.any(Function),
        300,
      );
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should call external API and cache result on miss', async () => {
      const apiRates = { NGN: 1, USD: 0.002, EUR: 0.0018, GBP: 0.0015 };
      mockCacheService.getOrSet.mockImplementation(async (_key: string, cb: () => Promise<Record<string, number>>) => cb());
      mockHttpService.get.mockReturnValue(
        of({ data: { conversion_rates: apiRates } }),
      );

      const result = await service.getRates(Currency.NGN);

      expect(result).toEqual(apiRates);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.example.com/key/latest/NGN',
      );
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'fx:rates:latest:NGN',
        expect.any(Function),
        300,
      );
    });

    it('should throw ServiceUnavailableException on HTTP failure', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key: string, cb: () => Promise<Record<string, number>>) => cb());
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.getRates(Currency.NGN)).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(service.getRates(Currency.NGN)).rejects.toThrow(
        'FX rates temporarily unavailable. Please retry shortly.',
      );
    });
  });

  describe('getRate', () => {
    it('should return correct rate for valid pair', async () => {
      const rates = { NGN: 1, USD: 0.002, EUR: 0.0018 };
      mockCacheService.getOrSet.mockResolvedValue(rates);

      const result = await service.getRate(Currency.NGN, Currency.USD);

      expect(result).toBe(0.002);
    });

    it('should throw BadRequestException for unsupported pair', async () => {
      const rates = { NGN: 1, USD: 0.002 };
      mockCacheService.getOrSet.mockResolvedValue(rates);

      await expect(service.getRate(Currency.NGN, Currency.EUR)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getRate(Currency.NGN, Currency.EUR)).rejects.toThrow(
        'Unsupported currency pair: NGN/EUR',
      );
    });
  });
});
