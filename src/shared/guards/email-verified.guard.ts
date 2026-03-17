import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>() as any;
    const user = request.user as { emailVerified?: boolean } | undefined;
    if (user?.emailVerified !== true) {
      throw new ForbiddenException('Email verification required to access trading features.');
    }
    return true;
  }
}
