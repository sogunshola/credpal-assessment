import { ManyToOne, JoinColumn, Column, Entity } from 'typeorm';
import { User } from '../../../../modules/users/entities/user.entity';
import { AbstractEntity } from '../../../entities/abstract-entity';
import { NotificationTypes } from '../enum/notification-types.enum';

@Entity('notifications')
export class NotificationEntity extends AbstractEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn()
  createdFor: User;

  @Column()
  createdForId: string;

  @Column()
  recordId: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column('jsonb')
  metaData: Record<string, any>;

  @Column({ type: 'enum', enum: NotificationTypes })
  type: NotificationTypes;
}
