// import { Controller } from '@nestjs/common';
// import { MessagePattern, Payload } from '@nestjs/microservices';
// import { EmailsService } from './emails.service';
// import { CreateEmailDto } from './dto/create-email.dto';
// import { UpdateEmailDto } from './dto/update-email.dto';
// import {
//   sendListResponse,
//   sendObjectResponse,
// } from '../shared/transformers/response.transformer';

// @Controller()
// export class EmailsController {
//   constructor(private readonly emailsService: EmailsService) {}

//   @MessagePattern({ cmd: 'createEmail' })
//   async create(@Payload() createEmailDto: CreateEmailDto) {
//     try {
//       const response = await this.emailsService.createEmail(createEmailDto);
//       return sendObjectResponse(response, 'new_email', 'Success');
//     } catch (error) {
//       console.log({
//         error,
//       });
//     }
//   }

//   @MessagePattern({ cmd: 'findAllEmails' })
//   async findAll(@Payload() payload: any) {
//     const { pagination } = payload;
//     const response = await this.emailsService.findAll(pagination);
//     return sendListResponse(response, 'email_list', 'Success');
//   }

//   @MessagePattern({ cmd: 'findOneEmail' })
//   async findOne(@Payload() id: string) {
//     const response = await this.emailsService.findOne(id);
//     return sendObjectResponse(response, 'email', 'Success');
//   }

//   @MessagePattern({ cmd: 'updateEmail' })
//   async update(@Payload() updateEmailDto: UpdateEmailDto) {
//     const response = await this.emailsService.update(
//       updateEmailDto.id,
//       updateEmailDto
//     );
//     return sendObjectResponse(response, 'update_email', 'Success');
//   }

//   @MessagePattern({ cmd: 'removeEmail' })
//   async remove(@Payload() id: string) {
//     const response = await this.emailsService.remove(id);
//     return sendObjectResponse(response, 'remove_email', 'Success');
//   }
// }
