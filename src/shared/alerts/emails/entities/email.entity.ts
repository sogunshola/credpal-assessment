import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../entities/abstract-entity';

@Entity('emails')
export class EmailEntity extends AbstractEntity {
  @Column()
  template: string;

  @Column('simple-json')
  metaData: any;

  @Column()
  receiverEmail: string;

  @Column()
  senderEmail: string;

  @Column({ nullable: true })
  replyTo: string;

  @Column()
  subject: string;

  @Column({ default: false })
  delivered: boolean;

  @Column({ nullable: true })
  error: string;

  @Column('jsonb', { default: [] })
  attachments: {
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
    cid?: string;
  }[];
}
