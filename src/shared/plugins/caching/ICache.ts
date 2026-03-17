export interface ICacheSetCommand {
  key: string;
  value: string;
  ttl?: number;
}
export interface IIncrByCommand {
  key: string;
  value: number;
}

export interface ISetTtlCommand {
  key: string;
  value: number;
}

export interface ICache {
  connect(): Promise<void>;
  getKeys(): Promise<string[]>;
  set<T>(key: string | Buffer, value: T, ttl: number): Promise<void>;
  mset(commands: ICacheSetCommand[]): Promise<void>;

  hset<T>(key: string | Buffer, field: string, value: T): Promise<void>;
  hget<T>(key: string | Buffer, field: string): Promise<T | undefined>;
  hdel(key: string | Buffer, field: string): Promise<void>;
  hkeys(key: string | Buffer): Promise<string[] | undefined>;
  get<T>(key: string | Buffer): Promise<T | undefined>;
  mget<T>(keys: string[] | Buffer[]): Promise<T[]>;

  setTtl(key: string | Buffer, ttl: number): Promise<void>;
  msetTtl(commands: ISetTtlCommand[]): Promise<void>;
  getTtl(key: string | Buffer): Promise<number>;
  mgetTtl(keys: string[] | Buffer[]): Promise<number[]>;

  del(key: string | Buffer): Promise<void>;
  mdel(keys: string[] | Buffer[]): Promise<void>;

  reset(): Promise<void>;
  clear(): Promise<void>;
  incrby(key: string | Buffer, increment: number): Promise<number>;
  mincrby(commands: IIncrByCommand[]): Promise<number[]>;
  gracefulShutdown(): Promise<void>;
  isShuttingDown: boolean;
}
