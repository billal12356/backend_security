import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

import { SessionGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { Role } from './enums/role.enum.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.username,
      dto.email,
      dto.password,
      dto.role,
    );
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const result = await this.authService.login(dto.username, dto.password);

    response.cookie('session', result.sessionToken, {
      httpOnly: true,

      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      expires: result.expiresAt,

      path: '/',
    });

    return {
      user: result.user,
    };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  getMe(@Req() request: Request) {
    return {
      user: request.user,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const sessionToken = request.cookies?.session;

    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    response.clearCookie('session', {
      httpOnly: true,

      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      path: '/',
    });

    return {
      message: 'Logged out successfully',
    };
  }

  @Get('user-area')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(Role.USER)
  getUserArea() {
    return {
      message: 'Welcome USER',
    };
  }
}
