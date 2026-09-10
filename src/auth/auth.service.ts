import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { eq, or } from 'drizzle-orm';

import * as bcrypt from 'bcrypt';

import { createHash, randomBytes } from 'crypto';

import { DATABASE } from '../database/database.provider.js';

import { users } from '../database/schema/users.schema.js';
import { sessions } from '../database/schema/sessions.schema.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE)
    private readonly db: any,
  ) {}

  // register
  async register(username: string, email: string, password: string) {
    // 1. Check existing user
    const existingUser = await this.db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));

    if (existingUser.length > 0) {
      throw new ConflictException('Username or email already exists');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Create user
    const [user] = await this.db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
      });

    return user;
  }

  // validate user for login
  async validateUser(username: string, password: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));

    const user = result[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  //create session
  async createSession(userId: string) {
    // Generate random token
    const sessionToken = randomBytes(32).toString('hex');

    // Hash token before storing it
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    // Session expires in 7 days
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.db.insert(sessions).values({
      userId,
      tokenHash,
      expiresAt,
    });

    // Return raw token ONLY to client
    return {
      sessionToken,
      expiresAt,
    };
  }

  //login
  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const session = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },

      sessionToken: session.sessionToken,

      expiresAt: session.expiresAt,
    };
  }

  // logout
  async logout(sessionToken: string) {
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
}
