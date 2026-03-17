import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Match } from '../../shared/decorators/match.decorator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'User password' })
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348012345678', description: 'Phone number', required: false })
  @IsNotEmpty()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Password' })
  @IsNotEmpty()
  password: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: '123456', description: 'Reset code sent to email' })
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'NewSecureP@ss123', description: 'New password' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'NewSecureP@ss123', description: 'Must match password' })
  @IsNotEmpty()
  @Match('password')
  confirmPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email or phone to send reset to' })
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  identifier: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'OTP sent to email' })
  @IsNotEmpty()
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export interface AuthPayload {
  id: string;
}
