import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty } from 'class-validator';
import { CreateEmailDto } from './create-email.dto';

export class UpdateEmailDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  template: string;

  @IsNotEmpty()
  metaData: any;

  @IsNotEmpty()
  receiverEmail: string;

  @IsNotEmpty()
  subject: string;
}
