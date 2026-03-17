import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../cache/cache.service';
import env from '../../config/env.config';
import { logger } from '../../config/winston';
import { Currency, FX_CACHE_KEY } from '../../constants/fx';

interface ExchangeRateApiResponse {
  conversion_rates: Record<string, number>;
}

@Injectable()
export class FxRatesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
  ) {}

  async getRates(baseCurrency: Currency): Promise<Record<string, number>> {
    const cacheKey = `${FX_CACHE_KEY}:${baseCurrency}`;
    const ttlSeconds = env.fxRatesCacheTtl;

    return this.cacheService.getOrSet(
      cacheKey,
      async (): Promise<Record<string, number>> => {
        const url = `${env.fxBaseUrl}/${env.fxApiKey}/latest/${baseCurrency}`;
        try {
          const response = await firstValueFrom(
            this.httpService.get<ExchangeRateApiResponse>(url),
          );
          return response.data.conversion_rates;
        } catch (err) {
          logger.error('FX rates fetch failed', { err, url });
          throw new ServiceUnavailableException(
            'FX rates temporarily unavailable. Please retry shortly.',
          );
        }
      },
      ttlSeconds,
    );
  }

  async getRate(from: Currency, to: Currency): Promise<number> {
    const rates = await this.getRates(from);
    const rate = rates[to];
    if (rate === undefined) {
      throw new BadRequestException(
        `Unsupported currency pair: ${from}/${to}`,
      );
    }
    return rate;
  }

  async getSupportedRates(): Promise<Record<string, number>> {
    return this.getRates(Currency.NGN);
  }
}
