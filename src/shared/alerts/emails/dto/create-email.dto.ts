import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEmailDto {
  @IsNotEmpty()
  template: string;

  @IsNotEmpty()
  metaData: any;

  @IsNotEmpty()
  receiverEmail: string;

  @IsOptional()
  senderEmail?: string = 'info@spottr.com';

  @IsOptional()
  replyTo?: string;

  @IsNotEmpty()
  subject: string;

  delivered?: boolean;

  error?: string;

  attachments?: {
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
    cid?: string;
  }[];
}
