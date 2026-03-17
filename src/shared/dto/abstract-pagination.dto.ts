import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class AbstractPaginationDto {
  @ApiProperty()
  @IsOptional()
  page: number = 1;

  @ApiProperty()
  @IsOptional()
  limit: number = 10;
}
