import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import {
  DeepPartial,
  EntityNotFoundError,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import { AppDataSource } from '../../config/db.config';
import { CacheService } from '../../modules/cache/cache.service';
import { AbstractPaginationDto } from '../dto/abstract-pagination.dto';
import { CACHE_LIMIT } from '../../config/cacheKeys';
import { SelectQueryBuilder } from 'typeorm';

//TODO: Fix all the type errors in this file
export class BasicService<T> {
  constructor(
    protected repository,
    public modelName: string,
    protected fields?: string[],
    protected cache?: CacheService,
    protected readonly cacheKeyPrefix: string = modelName,
  ) {}

  async clearCache() {
    if (this.cache) {
      const keys = await this.cache.getKeys();
      keys.forEach((key) => {
        if (key.startsWith(this.cacheKeyPrefix)) {
          this.cache.delete(key);
        }
      });
    }
  }

  fitsInCache(page: number, limit: number, cacheSize = CACHE_LIMIT) {
    return page * limit <= cacheSize - limit;
  }

  limit(items: T[], limit: number): T[] {
    if (!items) {
      return [];
    }
    if (!limit || limit <= 0) {
      return [];
    }

    if (items.length > limit) {
      const result = items.slice(0, limit);
      return result;
    }
    return items;
  }

  offset(items: T[], offset: number): T[] {
    if (!items) {
      return [];
    }
    if (!offset || offset <= 0) {
      return items;
    }
    if (offset > items.length) {
      return [];
    }

    const result = items.slice(offset);
    return result;
  }

  async getPage(items: T[], page = 0, pageSize = 100) {
    if (!pageSize || page < 0 || pageSize <= 0) {
      return {
        list: [],
        pagination: {
          page: 0,
          pageCount: 0,
          perPage: 0,
          total: 0,
          skipped: 0,
        },
      };
    }
    if (!items) {
      return {
        list: [],
        pagination: {
          page: 0,
          pageCount: 0,
          perPage: 0,
          total: 0,
          skipped: 0,
        },
      };
    }

    const toOffset = page * pageSize;
    if (page === 0) {
      const result = this.limit(items, pageSize);
      return result;
    }
    const offsetResult = this.offset(items, toOffset);
    const result = this.limit(offsetResult, pageSize);
    const total = Number(await this.cache.get(`${this.cacheKeyPrefix}:count`));
    const pagination = {
      page: Number(page),
      pageCount: Math.ceil(total / pageSize),
      limit: Number(pageSize),
      total,
      skipped: Number(pageSize * (page - 1)),
      nextPage: page * pageSize < total,
    };
    return {
      list: result,
      pagination,
    };
  }

  create(payload: DeepPartial<T>, ..._args: unknown[]): Promise<T> {
    const entity = this.repository.create(payload);
    if (this.cache) {
      this.clearCache();
    }
    return this.repository.save(entity);
  }

  bulkCreate(payload: DeepPartial<T>[], ..._args: unknown[]): Promise<T[]> {
    const entities = this.repository.create(payload);
    if (this.cache) {
      this.clearCache();
    }
    return this.repository.save(entities);
  }

  async findAll(pagination: AbstractPaginationDto, ..._args: unknown[]) {
    if (this.cache && this.fitsInCache(pagination.page, pagination.limit)) {
      const cacheKey = `${this.cacheKeyPrefix}:findAll`;
      const items = await this.cache.getOrSet(cacheKey, async () => {
        const [data, count] = await this.repository.findAndCount({
          take: CACHE_LIMIT,
        });
        this.cache.set(`${this.cacheKeyPrefix}:count`, count);
        return data;
      });
      return this.getPage(items, pagination.page, pagination.limit);
    }
    return this.paginateItems(this.repository, pagination);
  }

  list(): Promise<T[]> {
    if (this.cache) {
      const cacheKey = `${this.cacheKeyPrefix}:list`;
      return this.cache.getOrSet(cacheKey, () =>
        this.repository.find({ select: this.fields }),
      );
    }
    return this.repository.find({ select: this.fields });
  }

  async findOne(
    value: string,
    key = 'id',
    relations: string[] = [],
    fail = true,
  ): Promise<T> {
    const where = {};
    where[key] = value;
    const response = await this.repository.findOne({ where, relations });

    if (!response && fail) {
      throw new EntityNotFoundError(this.modelName, value);
    }

    return response;
  }

  async findOneBySlug(slug: string): Promise<T> {
    const response = await this.repository.findOne({ where: { slug } });

    if (!response) {
      throw new EntityNotFoundError(this.modelName, slug);
    }

    return response;
  }

  async update(id: string, payload: unknown): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, payload);
    if (this.cache) {
      this.clearCache();
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<Record<string, unknown>> {
    await this.findOne(id);
    await this.repository.delete(id);
    if (this.cache) {
      this.clearCache();
    }
    return {};
  }

  async resolveRelationships<Type>(
    payload: string[],
    entity: EntityTarget<Type>,
    key = 'id',
  ): Promise<Type[]> {
    const data: Promise<Type>[] = [];
    for (const value of payload) {
      const where = {};
      where[key] = value;
      const item = AppDataSource.getRepository(entity).findOne({
        where,
      });
      if (item) {
        data.push(item);
      }
    }
    const processed = await Promise.all(data);
    // retuen data that is not null
    return processed.filter((res) => res);
  }

  async paginateItems(
    repository: any,
    options: IPaginationOptions,
    searchOptions: FindOneOptions<T> | FindManyOptions<T> = {},
  ) {
    const response = await paginate(repository, options, searchOptions);

    const pagination = {
      page: Number(response.meta.currentPage),
      pageCount: Number(response.meta.totalPages),
      limit: Number(response.meta.itemsPerPage),
      total: Number(response.meta.totalItems),
      skipped: Number(
        response.meta.itemsPerPage * (response.meta.currentPage - 1),
      ),
      nextPage:
        response.meta.currentPage * response.meta.itemsPerPage <
        response.meta.totalItems,
    };

    return {
      list: response.items,
      pagination,
    };
  }

  protected paginate(
    queryBuilder: SelectQueryBuilder<T>,
    filter: AbstractPaginationDto,
  ): Promise<{
    list: T[];
    pagination: {
      page: number;
      pageCount: number;
      limit: number;
      total: number;
      skipped: number;
      nextPage: boolean;
    };
  }> {
    const { page, limit } = filter;

    const skip = (page - 1) * limit;
    const take = limit;

    const query = queryBuilder.skip(skip).take(take);

    return query.getManyAndCount().then(([list, total]) => {
      const pageCount = Math.ceil(total / limit);
      return {
        list,
        pagination: {
          page: Number(page),
          pageCount,
          limit: Number(limit),
          total,
          skipped: skip,
          nextPage: page * limit < total,
        },
      };
    });
  }
}
