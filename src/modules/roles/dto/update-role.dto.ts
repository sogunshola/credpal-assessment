import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsOptional()
  name: string;

  @IsOptional()
  description: string;
}

export class AddPermissionsToRoleDto {
  @IsNotEmpty()
  roleId: string;

  @IsNotEmpty()
  permissionsIds: string[];
}
