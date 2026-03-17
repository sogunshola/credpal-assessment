import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    if (!permissions) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user.role.permissions) {
      return false;
    }

    console.log('user permissions is', user);
    // return true;
    const hasPermission = () =>
      user.permissions.some((permission) =>
        permissions.includes(permission.name),
      );

    console.log('has role is', hasPermission());
    // console.log('user prmissions is', user.permissions);
    return hasPermission();
  }
}
