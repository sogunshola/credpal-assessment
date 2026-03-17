import { Controller, Post, Put, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

import { ApiTags } from '@nestjs/swagger';
import { resolveResponse } from '../../shared/resolvers';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // @Post()
  // create(createPermissionDto: CreatePermissionDto) {
  //   return resolveResponse(this.permissionsService.create(createPermissionDto));
  // }

  // @Put(':id')
  // update(@Param('id') id: string, updatePermissionDto: UpdatePermissionDto) {
  //   return resolveResponse(
  //     this.permissionsService.update(id, updatePermissionDto),
  //   );
  // }
}
