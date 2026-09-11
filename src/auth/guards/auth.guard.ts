import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../../database/database.provider.js';
import type { DrizzleDB } from '../../database/database.provider.js';
import { sessions } from '../../database/schema/sessions.schema.js';
import { users } from '../../database/schema/users.schema.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(DATABASE)
    private readonly db: DrizzleDB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionToken = request.cookies?.session;

    // No cookie
    if (!sessionToken) {
      throw new UnauthorizedException('Authentication required');
    }

    // Hash the session token
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    // Find session
    const result = await this.db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash));

    const resultData = result[0];

    // Session doesn't exist
    if (!resultData) {
      throw new UnauthorizedException('Invalid session');
    }

    const { session, user } = resultData;

    // Check expiration
    if (session.expiresAt <= new Date()) {
      // Delete expired session
      await this.db.delete(sessions).where(eq(sessions.id, session.id));
      throw new UnauthorizedException('Session expired');
    }

    // Attach user to request
    request.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return true;
  }
}
