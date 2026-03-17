import { Controller, Get, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { resolveResponse, sendObjectResponse } from '../../shared/resolvers';
import { User } from '../users/entities/user.entity';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @Public()
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  create(@Body() registerDto: RegisterDto) {
    return resolveResponse(this.authService.signUp(registerDto), 'Account Created');
  }

  @Post('sign-in')
  @Public()
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials' })
  @ApiResponse({ status: 403, description: 'Forbidden - email not verified' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async login(@Body() loginDto: LoginDto) {
    return resolveResponse(this.authService.signIn(loginDto), 'Login Success');
  }

  @Post('verify')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid or expired OTP' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return resolveResponse(
      this.authService.verifyEmail(dto),
      'Email verified successfully',
    );
  }

  @Post('resend-otp')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Account does not exist' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return resolveResponse(this.authService.resendEmailOtp(dto), 'Success');
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user from JWT' })
  @ApiResponse({ status: 200, description: 'Token is valid, returns current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  validateToken(@CurrentUser() user: User) {
    return sendObjectResponse(user, 'Token is valid');
  }

  @ApiBearerAuth()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset instructions sent if account exists' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async forgotPassword(@Body() { identifier }: ForgotPasswordDto) {
    return resolveResponse(this.authService.forgotPassword(identifier));
  }

  @ApiBearerAuth()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or invalid code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return resolveResponse(this.authService.resetPassword(resetPasswordDto));
  }
}
