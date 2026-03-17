import { createClient } from 'redis';
import { commandOptions, RedisClientType } from '@redis/client';
import { RedisClusterClientOptions } from '@redis/client/dist/lib/cluster';
import {
  ICache,
  ICacheSetCommand,
  IIncrByCommand,
  ISetTtlCommand,
} from './ICache';
import { ILogger } from './ILogger';
export class RedisClient implements ICache {
  protected client: RedisClientType;

  private shuttingDown = false;

  constructor(
    protected name: string,
    rootNodes: RedisClusterClientOptions[],
    protected logger: ILogger,
  ) {
    const first = rootNodes[0];
    this.client = createClient({
      password: first.password,
      url: first.url,
      username: first.username,
      readonly: first.readonly,
    });
    this.initEvents();
  }

  get isConnected(): boolean {
    return this.client.isReady;
  }

  private initEvents() {
    this.client.on('error', (err) => {
      this.logger.error(`Cache error on cache: ${this.name}`, err);
    });

    this.client.on('end', () => {
      this.logger.info(`${this.name} Cache connection end`);
    });

    this.client.on('connect', () => {
      this.logger.info(`${this.name} Cache connected`);
    });

    this.client.on('ready', () => {
      this.logger.info(`${this.name} Cache ready`);
    });
  }

  async set<T>(key: string | Buffer, value: T, ttl?: number): Promise<void> {
    if (this.shuttingDown || !key) return;
    try {
      await this.client.set(
        key,
        value as string,
        ttl !== null ? { EX: ttl } : null,
      );
    } catch (error) {
      this.logger.error(`Error setting key: ${key}`, error);
    }
  }
  reset(): Promise<void> {
    return this.clear();
  }
  async clear(): Promise<void> {
    try {
      await this.client.FLUSHDB();
    } catch (error) {
      this.logger.error(`Error clearing cache: ${this.name}`, error);
    }
  }
  async gracefulShutdown(): Promise<void> {
    if (this.shuttingDown) return;
    try {
      this.shuttingDown = true;
      await this.client.disconnect();
    } catch (error) {
      this.logger.error(`Error shutting down cache: ${this.name}`, error);
    }
  }

  async connect(): Promise<void> {
    if (this.shuttingDown) return;
    return await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.shuttingDown) return;
    return await this.client.disconnect();
  }

  onConnected(listener: (...args: any[]) => void) {
    return this.client.on('connect', listener);
  }

  get isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  async hset<T>(key: string | Buffer, field: string, value: T): Promise<void> {
    if (this.shuttingDown || !key || !field) return null;
    try {
      await this.client.hSet(key, field, value as string);
    } catch (error) {
      this.logger.error(
        `Error hset for key: ${key}, field: ${field}, value: ${value}`,
        error,
      );
    }
    return null;
  }
  async hget<T>(key: string | Buffer, field: string): Promise<T> {
    if (this.shuttingDown || !key || !field) return null;
    try {
      const getAsBuffer = Buffer.isBuffer(key);
      const result = await this.client.hGet(
        commandOptions({ returnBuffers: getAsBuffer }),
        key,
        field,
      );
      return result as T;
    } catch (error) {
      this.logger.error(`Error hget for key: ${key}, field: ${field}`, error);
    }
    return null;
  }

  async hmget<T>(key: string | Buffer, fields: string[]): Promise<T[]> {
    if (this.shuttingDown || !key || fields?.length === 0)
      return fields?.map(() => null);
    try {
      const getAsBuffer = Buffer.isBuffer(key);
      const cached = await this.client.hmGet(
        commandOptions({ returnBuffers: getAsBuffer }),
        key,
        fields,
      );
      return cached as T[];
    } catch (error) {
      this.logger.error(`Error getting fields: ${fields}`, error);
    }

    return fields?.map(() => null);
  }

  async hgetAll<T>(key: string | Buffer): Promise<T> {
    if (this.shuttingDown || !key) return null;
    try {
      const getAsBuffer = Buffer.isBuffer(key);
      const result = await this.client.hGetAll(
        commandOptions({ returnBuffers: getAsBuffer }),
        key,
      );
      if (JSON.stringify(result) == '{}') return null;
      return result as T;
    } catch (error) {
      this.logger.error(`Error hgetAll for key: ${key}`, error);
    }
    return null;
  }
  async hdel<T>(key: string | Buffer, field: string): Promise<T> {
    if (this.shuttingDown || !key || !field) return null;
    try {
      await this.client.hDel(key, field);
    } catch (error) {
      this.logger.error(`Error hdel for key: ${key}, field: ${field}`, error);
    }
    return null;
  }
  async hkeys(key: string | Buffer): Promise<string[]> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.hKeys(key);
    } catch (error) {
      this.logger.error(`Error hkeys for key: ${key}`, error);
    }
    return null;
  }

  async getTtl(key: string | Buffer): Promise<number> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting ttl for key: ${key}`, error);
    }
    return null;
  }

  async mgetTtl(keys: string[] | Buffer[]): Promise<number[]> {
    if (this.shuttingDown) {
      return keys?.map(() => null) || [];
    }
    return await Promise.all(
      keys.map((key: string | Buffer) => this.getTtl(key)),
    );
  }
  async del(key: string | Buffer): Promise<void> {
    if (this.shuttingDown || !key) return null;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error invalidating key: ${key}`, error);
    }
    return null;
  }
  async mdel(keys: string[] | Buffer[]): Promise<void> {
    if (this.shuttingDown) return null;
    await Promise.all(keys.map((key: string | Buffer) => this.del(key)));
  }

  async mset(commands: ICacheSetCommand[]): Promise<void> {
    if (this.shuttingDown || !commands) return;
    try {
      await Promise.all(
        commands.map((command: ICacheSetCommand) =>
          this.client.set(
            command.key,
            command.value,
            command.ttl !== null ? { EX: command.ttl } : null,
          ),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Error setting keys: ${commands.map((command) => command.key)}`,
        error,
      );
    }
  }

  async setTtl(key: string | Buffer, ttl: number): Promise<void> {
    if (this.shuttingDown || !key) return;
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      this.logger.error(`Error setting ttl for key: ${key}`, error);
    }
    return null;
  }
  async msetTtl(commands: ISetTtlCommand[]): Promise<void> {
    if (this.shuttingDown || !commands) return;
    try {
      await Promise.all(
        commands.map((command: ISetTtlCommand) =>
          this.client.expire(command.key, command.value),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Error setting ttl for keys: ${commands.map((command) => command.key)}`,
        error,
      );
    }
    return null;
  }

  async get<T>(key: string | Buffer): Promise<T> {
    if (this.shuttingDown || !key) return null;
    try {
      const getAsBuffer = Buffer.isBuffer(key);
      const cached = await this.client.get(
        commandOptions({ returnBuffers: getAsBuffer }),
        key,
      );

      return cached as T;
    } catch (error) {
      this.logger.error(`Error getting key: ${key}`, error);
    }

    return null;
  }

  async mget<T>(keys: string[] | Buffer[]): Promise<T[]> {
    if (this.shuttingDown || !keys || keys?.length === 0)
      return keys?.map(() => null);
    try {
      const getAsBuffer = Buffer.isBuffer(keys[0]);
      const cached = await this.client.mGet(
        commandOptions({ returnBuffers: getAsBuffer }),
        keys,
      );
      return cached as T[];
    } catch (error) {
      this.logger.error(`Error getting keys: ${keys}`, error);
    }

    return keys?.map(() => null);
  }

  async incrby(key: string | Buffer, increment: number): Promise<number> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.incrBy(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing key: ${key}`, error);
    }

    return null;
  }

  async mincrby(commands: IIncrByCommand[]): Promise<number[]> {
    if (this.shuttingDown || !commands) return null;
    try {
      return await Promise.all(
        commands.map((command: IIncrByCommand) => {
          if (!command.key) return null;
          return this.client.incrBy(command.key, command.value);
        }),
      );
    } catch (error) {
      this.logger.error(
        `Error incrementing keys: ${commands.map((command) => command.key)}`,
        error,
      );
    }

    return commands.map(() => null);
  }

  async zAdd(key: string, score: number, value: string): Promise<void> {
    if (this.shuttingDown || !key) return null;
    try {
      await this.client.zAdd(key, { score, value });
    } catch (error) {
      this.logger.error(
        `Error zAdd for key: ${key}, score: ${score}, value: ${value}`,
        error,
      );
    }
    return null;
  }
  async zCount(key: string, min: number, max: number): Promise<number> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.zCount(key, min, max);
    } catch (error) {
      this.logger.error(
        `Error zCount for key: ${key}, min: ${min}, max: ${max}`,
        error,
      );
    }
    return null;
  }

  async zPopMin(key: string, amount = 1): Promise<string[]> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.sendCommand(['ZPOPMIN', key, `${amount}`]);
    } catch (error) {
      this.logger.error(`Error zPopMin for key: ${key}`, error);
    }
    return null;
  }

  async zRemRangeByScore(key: string, min: number, max: number): Promise<void> {
    if (this.shuttingDown || !key) return null;
    try {
      await this.client.sendCommand([
        'ZREMRANGEBYSCORE',
        key,
        `${min}`,
        `${max}`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error zRemRangeByScore for key: ${key}, min: ${min}, max: ${max}`,
        error,
      );
    }
  }

  async zRevRange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.sendCommand([
        'ZREVRANGE',
        key,
        `${start}`,
        `${stop}`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error zRevRange for key: ${key}, start: ${start}, stop: ${stop}`,
        error,
      );
    }

    return null;
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.sendCommand([
        'ZRANGE',
        key,
        `${start}`,
        `${stop}`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error zRange for key: ${key}, start: ${start}, stop: ${stop}`,
        error,
      );
    }

    return null;
  }

  async zRangeByScore(
    key: string,
    min: number,
    max: number,
  ): Promise<string[]> {
    if (this.shuttingDown || !key) return null;
    try {
      return await this.client.sendCommand([
        'ZRANGEBYSCORE',
        key,
        `${min}`,
        `${max}`,
      ]);
    } catch (error) {
      this.logger.error(
        `Error zRangeByScore for key: ${key}, min: ${min}, max: ${max}`,
        error,
      );
    }

    return null;
  }

  async getKeys(): Promise<string[]> {
    if (this.shuttingDown) {
      return null;
    }
    try {
      return await this.client.keys('*');
    } catch (error) {
      this.logger.error(`Error getting keys`, error);
    }

    return null;
  }
}
