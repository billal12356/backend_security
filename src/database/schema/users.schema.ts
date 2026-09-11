import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['USER', 'MANAGER', 'ADMIN']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  username: varchar('username', {
    length: 100,
  })
    .notNull()
    .unique(),

  email: varchar('email', {
    length: 255,
  })
    .notNull()
    .unique(),

  passwordHash: varchar('password_hash', {
    length: 255,
  }).notNull(),

  role: userRoleEnum('role').default('USER').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
