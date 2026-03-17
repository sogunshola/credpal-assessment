import { BeforeInsert, Column } from 'typeorm';
import { Helper } from '../helpers';
import { AbstractEntity } from './abstract-entity';

export class BasicEntity extends AbstractEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  description: string;

  @BeforeInsert()
  handleBeforeInsert() {
    this.slug = Helper.slugify(this.name);
  }
}
