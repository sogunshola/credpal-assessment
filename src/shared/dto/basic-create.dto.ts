import { IsNotEmpty } from 'class-validator';

export class BasicCreateDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;
}
