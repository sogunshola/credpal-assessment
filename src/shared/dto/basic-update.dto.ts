import { IsNotEmpty, IsOptional } from 'class-validator';

export class BasicUpdateDto {
  @IsOptional()
  name: string;

  @IsOptional()
  description: string;
}
