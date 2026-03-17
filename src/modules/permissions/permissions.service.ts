import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../shared/services/basic-service.service';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService extends BasicService<Permission> {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {
    super(permissionRepo, 'Permissions');
  }
}
