import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { AuthPayload } from './auth.dto';
import env from '../../config/env.config';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
      secretOrKey: env.jwtSecret,
    });
  }

  async validate(payload: AuthPayload) {
    const { id } = payload;
    // console.log('hello');
    const user = await this.userRepo.find({ where: { id } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
