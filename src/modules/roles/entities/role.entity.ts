import { Permission } from './../../permissions/entities/permission.entity';
import { Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BasicEntity } from '../../../shared/entities/basic-entity';

@Entity('roles')
export class Role extends BasicEntity {
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable()
  permissions: Permission[];
}
