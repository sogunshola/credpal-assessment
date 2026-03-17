import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  AuthPayload,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ResendOtpDto,
  VerifyEmailDto,
} from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { getRepository } from 'typeorm';
import { AppEvents } from '../../constants';
import { CreateEmailDto } from '../../shared/alerts/emails/dto/create-email.dto';
import { Helper } from '../../shared/helpers';
import { CacheService } from '../cache/cache.service';
import { User } from '../users/entities/user.entity';
import { AppTemplates, AppMailSenders } from '../../constants/email';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isDev } from '../../environment/isDev';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private readonly cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async signUp(credentials: RegisterDto) {
    const user = await this.usersService.create(credentials);
    const otp = isDev() ? '123456' : Helper.generateToken(6);
    const otpKey = `otp:${user.email}`;
    await this.cacheService.set(otpKey, otp, 600);

    const email: CreateEmailDto = {
      subject: 'Verify your email',
      template: AppTemplates.VERIFY_ACCOUNT,
      metaData: { code: otp },
      receiverEmail: user.email,
      senderEmail: AppMailSenders.SUPPORT,
    };
    // this.eventEmitter.emit(AppEvents.SEND_EMAIl, email);

    return { message: 'Registration successful. Check your email for OTP.' };
  }

  async signIn(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;
      const user = await this.usersService.findOne(email, 'email', undefined, false);
      if (user && (await user.comparePassword(password))) {
        if (user.emailVerified === false) {
          throw new UnauthorizedException('Please verify your email before logging in.');
        }
        const payload: AuthPayload = { id: user.id };
        const token = this.jwtService.sign(payload);
        return { user: user.toJSON(), token };
      }
      throw new UnauthorizedException('Invalid Credentials');
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid Credentials');
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ user: any; token: string }> {
    const { email, otp } = dto;
    const otpKey = `otp:${email}`;
    const storedOtp = await this.cacheService.get(otpKey);
    if (storedOtp == null || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    const user = await this.usersService.findOne(email, 'email');
    if (!user) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    user.emailVerified = true;
    await user.save();
    await this.cacheService.delete(otpKey);

    const payload: AuthPayload = { id: user.id };
    const token = this.jwtService.sign(payload);
    return { user: user.toJSON(), token };
  }

  async resendEmailOtp(dto: ResendOtpDto) {
    const emailAddr = dto.email?.trim()?.toLowerCase();
    const user = await this.usersService.findOne(emailAddr, 'email');
    if (!user) {
      throw new NotFoundException('Account does not exist');
    }

    if (user.emailVerified === true) {
      return { message: 'Email already verified.' };
    }

    const otp = isDev() ? '123456' : Helper.generateToken(6);
    const otpKey = `otp:${user.email}`;
    await this.cacheService.set(otpKey, otp, 600);

    const email: CreateEmailDto = {
      subject: 'Verify your email',
      template: AppTemplates.VERIFY_ACCOUNT,
      metaData: { code: otp },
      receiverEmail: user.email,
      senderEmail: AppMailSenders.SUPPORT,
    };
    // this.eventEmitter.emit(AppEvents.SEND_EMAIl, email);

    return { message: 'OTP resent. Check your email.' };
  }

  async forgotPassword(identifier: string) {
    const user = await getRepository(User).findOne({
      where: [{ email: identifier }, { phoneNumber: identifier }],
    });
    if (!user) throw new NotFoundException('Account does not exist');

    const otp = Helper.generateToken();

    // this.eventEmitter.emit(AppEvents.STORE_IN_CACHE, {
    //   key: identifier,
    //   value: otp,
    // });

    await this.cacheService.set(identifier, otp);

    const email: CreateEmailDto = {
      subject: 'Forgot Password',
      template: AppTemplates.FORGOT_PASSWORD,
      metaData: { code: otp },
      receiverEmail: user.email,
      senderEmail: AppMailSenders.SUPPORT,
    };

    // this.eventEmitter.emit(AppEvents.SEND_EMAIl, email);

    // this.eventEmitter.emit(AppEvents.SEND_TEXT, {
    //   code: otp,
    //   to: user.telephone,
    // });

    return {};
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, password, email } = resetPasswordDto;
    const user: User = await this.usersService.findOne(email, 'email');
    const otp = await this.cacheService.get(email);
    console.log(otp, code);
    if (otp != code) {
      throw new UnauthorizedException('Invalid reset token');
    }
    user.password = password;
    // user.code = null;
    await user.handleBeforeInsert();
    await user.save();
    await this.cacheService.delete(email);
    return {};
  }
}
