import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { DATABASE } from '../database/database.provider.js';
import type { DrizzleDB } from '../database/database.provider.js';
import { users } from '../database/schema/users.schema.js';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { PaginationDto } from './dto/pagination.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE)
    private readonly db: DrizzleDB,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        or(
          eq(users.username, createUserDto.username),
          eq(users.email, createUserDto.email),
        ),
      );

    if (existing.length > 0) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const [newUser] = await this.db
      .insert(users)
      .values({
        username: createUserDto.username,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role ?? 'USER',
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    return newUser;
  }

  async findAll({ page = 1, limit = 10, search, role }: PaginationDto) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (currentPage - 1) * pageSize;

    const searchCondition = search
      ? or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`),
        )
      : undefined;

    const roleCondition = role ? eq(users.role, role) : undefined;
    const conditions = and(searchCondition, roleCondition);

    const data = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(users)
      .where(conditions);

    const total = Number(totalResult?.count ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const updatePayload: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updateUserDto.username) {
      updatePayload.username = updateUserDto.username;
    }

    if (updateUserDto.email) {
      updatePayload.email = updateUserDto.email;
    }

    if (updateUserDto.role) {
      updatePayload.role = updateUserDto.role;
    }

    if (updateUserDto.password) {
      updatePayload.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        12,
      );
    }

    const [updatedUser] = await this.db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.db.delete(users).where(eq(users.id, id));

    return {
      message: `User with ID '${id}' deleted successfully`,
    };
  }
}
