-- Create users table with LINE integration and roles
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique not null,
  display_name text,
  picture_url text,
  email text,
  role text not null default 'user' check (role in ('super_admin', 'store_manager', 'community_manager', 'user')),
  store_id bigint references stores(id),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  last_login_at timestamp with time zone
);

-- Create sessions table for JWT tokens
create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table users enable row level security;
alter table user_sessions enable row level security;

-- Policies for users
create policy "Users can view their own profile"
on users for select
using (true);

create policy "Service role full access on users"
on users for all
to service_role
using (true)
with check (true);

-- Policies for sessions
create policy "Service role full access on sessions"
on user_sessions for all
to service_role
using (true)
with check (true);

-- Create index for faster lookups
create index if not exists idx_users_line_user_id on users(line_user_id);
create index if not exists idx_sessions_token on user_sessions(token);
create index if not exists idx_sessions_user_id on user_sessions(user_id);
