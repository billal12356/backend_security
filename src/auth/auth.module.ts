import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RolesGuard } from './guards/roles.guard.js';
import { SessionGuard } from './guards/auth.guard.js';

@Module({
  controllers: [AuthController],

  providers: [AuthService, SessionGuard, RolesGuard],

  exports: [SessionGuard, RolesGuard],
})
export class AuthModule {}
