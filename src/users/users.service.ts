import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { DATABASE } from '../database/database.provider.js';
import { users } from '../database/schema/users.schema.js';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
} from 'drizzle-orm';
import { Role } from '../auth/enums/role.enum.js';
import { PaginationDto } from './dto/pagination.dto.js';
@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE)
    private readonly db: any,
  ) { }

  async findAll({
    page = 1,
    limit = 10,
    search,
    role,
  }: PaginationDto) {
    // 1. Protect pagination values
    const currentPage = Math.max(
      1,
      Number(page) || 1,
    );

    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number(limit) || 10,
      ),
    );

    // 2. Calculate offset
    const offset =
      (currentPage - 1) * pageSize;

    // 3. Search condition
    const searchCondition = search
      ? or(
        ilike(
          users.username,
          `%${search}%`,
        ),
        ilike(
          users.email,
          `%${search}%`,
        ),
      )
      : undefined;

    const roleCondition = role
      ? eq(users.role, role)
      : undefined;

    const conditions = and(
      searchCondition,
      roleCondition,
    );

    // 4. Get users
    const data = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 5. Get total
    const [totalResult] = await this.db
      .select({
        count: count(),
      })
      .from(users)
      .where(conditions);

    const total =
      Number(totalResult.count);

    // 6. Calculate total pages
    const totalPages = Math.ceil(
      total / pageSize,
    );

    // 7. Return response
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

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
