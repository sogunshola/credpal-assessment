import { Entity, OneToMany } from 'typeorm';
import { BasicEntity } from '../../../shared/entities/basic-entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('permission-groups')
export class PermissionGroup extends BasicEntity {
  @OneToMany(() => Permission, (permission) => permission.permissionGroup, {
    eager: true,
  })
  permissions: Permission[];
}
