import { OnModuleInit } from '@nestjs/common';
import env from '../../config/env.config';
import { ICache } from '../../shared/plugins/caching/ICache';
import { MemoryCache } from '../../shared/plugins/caching/memoryCache';
import { RedisClient } from '../../shared/plugins/caching/redisClient';
import { logger } from '../../config/winston';

export class CacheService implements OnModuleInit {
  ttl = 6000;
  constructor(private memoryCache: ICache, private remoteCache: ICache) {}

  async get(key: string): Promise<any> {
    // let value = await this.memoryCache.get(key);
    let value = null;
    if (!value) {
      value = await this.remoteCache.get(key);
    }
    if (!value) {
      return null;
    }
    await this.memoryCache.set(key, value, this.ttl);
    return value;
  }

  async set(key: string, value: any, ttl: number = this.ttl): Promise<void> {
    await this.memoryCache.set(key, value, ttl);
    await this.remoteCache.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.memoryCache.del(key);
    await this.remoteCache.del(key);
  }

  async clear(): Promise<void> {
    await this.memoryCache.clear();
    await this.remoteCache.clear();
  }

  async connect(): Promise<void> {
    await this.memoryCache.connect();
    await this.remoteCache.connect();
  }

  async onModuleInit() {
    this.memoryCache = new MemoryCache(``);
    this.remoteCache = new RedisClient(``, [{ url: env.redisUrl }], logger);
    await this.connect();
  }

  async getOrSet(key: string, cb: () => Promise<any>, ttl: number = this.ttl): Promise<any> {
    const value = await this.get(key);
    if (value) {
      return JSON.parse(value);
    }
    const result = await cb();
    await this.set(key, JSON.stringify(result), ttl);
    return result;
  }

  async getKeys(): Promise<string[]> {
    const rkeys = await this.remoteCache.getKeys();
    const mkeys = await this.memoryCache.getKeys();
    return [...rkeys, ...mkeys];
  }
}
