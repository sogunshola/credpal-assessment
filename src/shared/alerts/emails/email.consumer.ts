import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { getRepository } from 'typeorm';
import { EmailsService } from './emails.service';
import { EmailEntity } from './entities/email.entity';

@Processor('emailQueue')
export class EmailsConsumer {
  constructor(private readonly emailService: EmailsService) {}

  @Process()
  async sendMail(job: Job<EmailEntity>) {
    try {
      const {
        subject,
        metaData,
        receiverEmail,
        senderEmail,
        template,
        id,
        replyTo,
        attachments,
      } = job.data;

      console.log({ jobdata: job.data });

      this.emailService
        .sendEmail({
          template,
          to: receiverEmail,
          from: senderEmail,
          subject,
          replyTo,
          attachments,
          context: { ...metaData },
          // context: { ...metaData, moneyFormat: Helper.moneyFormat },
        })
        .then(
          async () =>
            await getRepository(EmailEntity).update(id, { delivered: true }),
        )
        .catch(async (emailError) => {
          console.log({ emailError });
          await getRepository(EmailEntity).update(id, { delivered: false });
        });
    } catch (error) {
      console.log({ processerror: error });
    }
  }
}
