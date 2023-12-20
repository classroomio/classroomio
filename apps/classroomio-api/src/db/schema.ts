import {
  integer,
  pgEnum,
  pgTable,
  char,
  serial,
  uniqueIndex,
  varchar,
  text,
  timestamp,
  uuid,
  jsonb
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 })
});

export const course = pgTable('course', {});

export const organization = pgTable('organization', {
  id: uuid('id').defaultRandom(),
  name: char('name').notNull(),
  siteName: text('site_name'),
  avatarUrl: text('avatar_url'),
  settings: jsonb('settings'),
  landingpage: jsonb('landingpage'),
  theme: text('theme'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
