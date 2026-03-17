import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionQueryDto } from './dto/transaction-query.dto';

export type PaginatedTransactionsResult = {
  list: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
    skipped: number;
    nextPage: boolean;
  };
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getUserTransactions(
    userId: string,
    query: TransactionQueryDto,
  ): Promise<PaginatedTransactionsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .orderBy('t.createdAt', 'DESC');

    if (query.type != null) {
      qb.andWhere('t.type = :type', { type: query.type });
    }
    if (query.status != null) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.currency != null) {
      qb.andWhere(
        '(t.fromCurrency = :currency OR t.toCurrency = :currency)',
        { currency: query.currency },
      );
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [list, total] = await qb.getManyAndCount();
    const pageCount = Math.ceil(total / limit);

    return {
      list,
      pagination: {
        page,
        limit,
        total,
        pageCount,
        skipped: skip,
        nextPage: page * limit < total,
      },
    };
  }
}
