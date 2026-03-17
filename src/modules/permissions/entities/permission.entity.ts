import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { PermissionGroup } from '../../permission-groups/entities/permission-group.entity';
import { Role } from '../../roles/entities/role.entity';
import slugify from 'slugify';
import { BasicEntity } from '../../../shared/entities/basic-entity';

@Entity('permissions')
export class Permission extends BasicEntity {
  @ManyToMany(() => Role, (role) => role.permissions, { cascade: true })
  roles: Role[];

  @ManyToOne(() => PermissionGroup, (permissionGroup) => permissionGroup)
  @JoinColumn()
  permissionGroup: PermissionGroup;

  @Column()
  permissionGroupId: string;

  @BeforeInsert()
  handleBeforeInsert() {
    var reversed = this.name.split(' ').reverse().join(' ');
    this.slug = slugify(reversed, { lower: true, replacement: '.' });
  }
}
