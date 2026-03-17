import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../shared/services/basic-service.service';
import { Permission } from '../permissions/entities/permission.entity';
import { AddPermissionsToRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService extends BasicService<Role> {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {
    super(roleRepo, 'Roles');
  }

  async addPermissionsToRole(addPermissionsToRoleDto: AddPermissionsToRoleDto) {
    const { roleId, permissionsIds } = addPermissionsToRoleDto;
    const role = await this.findOne(roleId);

    const permissions = await this.resolveRelationships(
      permissionsIds,
      Permission,
    );
    // for (const permissionId of permissionsId) {
    //   const permission = await getRepository(Permission).findOne(permissionId);
    //   if (!permission) {
    //     continue;
    //   }
    //   permissions.push(permission);
    // }
    role.permissions = permissions;
    return this.roleRepo.save(role);
  }
}
