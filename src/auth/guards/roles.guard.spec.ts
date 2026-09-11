import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../enums/role.enum.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user?: {
    role: string;
  }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on route', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user has required or higher role level', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);
    const context = createMockExecutionContext({ role: Role.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user has lower role level than required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockExecutionContext({ role: Role.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
