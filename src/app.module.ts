import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AppDataSource, typeOrmConfig } from './config/db.config';
import { EmailsModule } from './shared/alerts/emails/emails.module';
import { NotificationsModule } from './shared/alerts/notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import env from './config/env.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { BullModule } from '@nestjs/bull';
import { WebsocketModule } from './websockets/websocket.module';
import { FxRatesModule } from './modules/fx-rates/fx-rates.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { GlobalModule } from './global.module';
import Redis from 'ioredis';
const mg = require('nodemailer-mailgun-transport');
const redisUrl = new URL(env.redisUrl);

@Module({
  imports: [
    GlobalModule,
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 30 },
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: mg({
        auth: {
          api_key: env.mailgunApiKey,
          domain: env.mailgunDomain,
        },
      }),
      template: {
        dir: __dirname + '/templates',
        adapter: new PugAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    BullModule.forRoot({
      createClient: () =>
        new Redis(env.redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        }),
      redis:
        redisUrl.protocol == 'rediss:'
          ? {
              tls: {
                rejectUnauthorized: false,
              },
            }
          : null,
    }),
    AuthModule,
    FxRatesModule,
    WalletModule,
    TransactionsModule,
    EmailsModule,
    NotificationsModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
