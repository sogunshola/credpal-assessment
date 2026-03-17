import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

import * as dotenv from 'dotenv';
import env from '../../config/env.config';
import { UsersModule } from '../users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JWTGuard } from '../../shared/guards/auth.guard';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: {
        expiresIn: env.expiresIn,
      },
    }),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, {
    provide: APP_GUARD,
    useClass: JWTGuard,
  },],
  controllers: [AuthController],
  exports: [PassportModule, JwtStrategy, JwtModule],
})
export class AuthModule {}
