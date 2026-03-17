import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { classToPlain, Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { AbstractEntity } from '../../../shared/entities/abstract-entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phoneNumber: string;

  @Exclude()
  @Column()
  password: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn()
  role: Role;

  @Column({ nullable: true })
  roleId: string;

  @Column({ default: true })
  status: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneNumberVerified: boolean;

  protected fullName: string;
  protected verified: boolean;

  @BeforeInsert()
  async handleBeforeInsert() {
    this.password = await bcrypt.hash(this.password, 10);
    this.verified = this.emailVerified || this.phoneNumberVerified;
  }

  @AfterLoad()
  handleAfterLoad() {
    this.fullName = this.firstName + ' ' + this.lastName;
  }

  async comparePassword(password: string) {
    return await bcrypt.compare(password, this.password);
  }

  toJSON() {
    return classToPlain(this);
  }
}
