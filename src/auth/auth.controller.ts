import {
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';

import type  { Response } from 'express';

import { AuthService } from './auth.service.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(
      dto.username,
      dto.email,
      dto.password,
    );
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const result =
      await this.authService.login(
        dto.username,
        dto.password,
      );

    response.cookie(
      'session',
      result.sessionToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          'production',

        sameSite: 'lax',

        expires: result.expiresAt,

        path: '/',
      },
    );

    return {
      user: result.user,
    };
  }
}