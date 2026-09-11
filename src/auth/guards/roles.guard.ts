import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import {
  Role,
  ROLE_LEVEL,
} from '../enums/role.enum.js';

import {
  ROLES_KEY,
} from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );
    console.log("requiredRoles",requiredRoles);
    
    if (!requiredRoles) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;
    console.log("user",user);
    
    if (!user) {
      throw new ForbiddenException(
        'User not authenticated',
      );
    }

    const userRole = user.role as Role;

    const userLevel =
      ROLE_LEVEL[userRole];

      console.log('userLevel',userLevel)
    const requiredLevel = Math.min(
      ...requiredRoles.map(
        (role) => ROLE_LEVEL[role],
      ),
    );

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        'Access denied. You do not have the required permissions to perform this action.',
      );
    }

    return true;
  }
}