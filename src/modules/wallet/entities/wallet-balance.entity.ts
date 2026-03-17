import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { AbstractEntity } from '../../../shared/entities/abstract-entity';
import { User } from '../../users/entities/user.entity';
import { Currency } from '../../../constants/fx';

@Entity('wallet_balances')
@Unique(['userId', 'currency'])
export class WalletBalance extends AbstractEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: '0',
  })
  balance: string;
}
