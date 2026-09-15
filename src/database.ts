import pg from 'pg';
import type { TelegramUser } from './telegram-auth.js';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 5 })
  : null;

export type AppUser = {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  first_name: string;
  last_name: string | null;
  language_code: string | null;
  photo_url: string | null;
};

export async function upsertTelegramUser(user: TelegramUser): Promise<AppUser> {
  if (!db) throw new Error('DATABASE_URL is not configured');

  const result = await db.query<AppUser>(
    `insert into public.users
      (telegram_user_id, telegram_username, first_name, last_name, language_code, photo_url, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (telegram_user_id) do update set
       telegram_username = excluded.telegram_username,
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       language_code = excluded.language_code,
       photo_url = excluded.photo_url,
       updated_at = now()
     returning id, telegram_user_id::text, telegram_username, first_name, last_name, language_code, photo_url`,
    [user.id, user.username ?? null, user.first_name, user.last_name ?? null, user.language_code ?? null, user.photo_url ?? null]
  );

  return result.rows[0];
}

export async function databaseHealth(): Promise<boolean> {
  if (!db) return false;
  await db.query('select 1');
  return true;
}
