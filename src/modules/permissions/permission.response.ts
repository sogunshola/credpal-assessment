import { ApiProperty } from '@nestjs/swagger';
import { ResponseDTO } from '../../shared/resolvers';

export class PermissionResponse extends ResponseDTO<unknown> {
  // @ApiProperty()
  // id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  // @ApiProperty()
  // createdAt: Date;

  // @ApiProperty()
  // updatedAt: Date;
}

export class PermissionListResponse {}
