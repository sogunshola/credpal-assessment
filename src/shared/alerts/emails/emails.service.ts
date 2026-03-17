import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { AppEvents } from '../../../constants';
import { BasicService } from '../../services/basic-service.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { EmailEntity } from './entities/email.entity';

@Injectable()
export class EmailsService extends BasicService<EmailEntity> {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly emailRepo: Repository<EmailEntity>,
    private readonly mailerService: MailerService,
    @InjectQueue('emailQueue') private readonly emailQueue: Queue,
  ) {
    super(emailRepo, 'Email');
  }

  @OnEvent(AppEvents.SEND_EMAIl)
  async createEmail(createEmailDto: CreateEmailDto) {
    console.log(createEmailDto);
    const email = await this.create(createEmailDto);
    console.log('email sent to queue');
    this.emailQueue.add(email, {
      attempts: 5,
      delay: 3000,
    });

    return email;
  }

  sendEmail(options: ISendMailOptions) {
    return this.mailerService.sendMail(options);
  }
}
