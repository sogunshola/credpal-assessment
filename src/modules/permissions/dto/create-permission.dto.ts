import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { BasicCreateDto } from '../../../shared/dto/basic-create.dto';

export class CreatePermissionDto extends BasicCreateDto {
  @IsNotEmpty()
  permissionGroupId: string;
}
