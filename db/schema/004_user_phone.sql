alter table public.users
  add column if not exists phone_number text;

comment on column public.users.phone_number is
'Phone number explicitly shared by the user with the Telegram bot; never inferred from Mini App initData.';
