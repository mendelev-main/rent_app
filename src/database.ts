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

export type PropertyStatus = 'draft' | 'published' | 'archived';
export type Property = {
  id: string;
  owner_id: string;
  status: PropertyStatus;
  title: string;
  city: string;
  address: string;
  description: string;
  price_per_night: string;
  currency: 'BYN';
  max_guests: number;
  amenities: string[];
  house_rules: string;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyInput = {
  title: string;
  city: string;
  address: string;
  description?: string;
  price_per_night: number;
  max_guests: number;
  amenities?: string[];
  house_rules?: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
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

export async function createProperty(ownerId: string, input: PropertyInput): Promise<Property> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const result = await db.query<Property>(
    `insert into public.properties
      (owner_id, title, city, address, description, price_per_night, max_guests, amenities, house_rules, check_in_time, check_out_time)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
     returning *`,
    [ownerId, input.title, input.city, input.address, input.description ?? '', input.price_per_night, input.max_guests,
      JSON.stringify(input.amenities ?? []), input.house_rules ?? '', input.check_in_time ?? null, input.check_out_time ?? null]
  );
  return result.rows[0];
}

export async function listOwnerProperties(ownerId: string): Promise<Property[]> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const result = await db.query<Property>(
    `select * from public.properties where owner_id=$1 order by updated_at desc`, [ownerId]
  );
  return result.rows;
}

export async function getOwnerProperty(ownerId: string, propertyId: string): Promise<Property | null> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const result = await db.query<Property>(
    `select * from public.properties where id=$1 and owner_id=$2 limit 1`, [propertyId, ownerId]
  );
  return result.rows[0] ?? null;
}

export async function updateOwnerProperty(ownerId: string, propertyId: string, input: PropertyInput): Promise<Property | null> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const result = await db.query<Property>(
    `update public.properties set
       title=$3, city=$4, address=$5, description=$6, price_per_night=$7, max_guests=$8,
       amenities=$9::jsonb, house_rules=$10, check_in_time=$11, check_out_time=$12, updated_at=now()
     where id=$1 and owner_id=$2 returning *`,
    [propertyId, ownerId, input.title, input.city, input.address, input.description ?? '', input.price_per_night, input.max_guests,
      JSON.stringify(input.amenities ?? []), input.house_rules ?? '', input.check_in_time ?? null, input.check_out_time ?? null]
  );
  return result.rows[0] ?? null;
}

export async function databaseHealth(): Promise<boolean> {
  if (!db) return false;
  await db.query('select 1');
  return true;
}
