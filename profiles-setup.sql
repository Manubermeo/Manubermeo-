-- PaveDirt · tabla "profiles"
-- Guarda el perfil de ciclista + ficha técnica de la bici (todo el objeto
-- que llena SetupScreen) como JSON, uno por usuario autenticado.
-- Ejecutar en Supabase → SQL Editor (Idempotente: seguro para re-ejecutar).

create table if not exists profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Cada usuario solo puede leer, crear, actualizar o borrar su propia fila.
drop policy if exists "Los usuarios ven su propio perfil" on profiles;
create policy "Los usuarios ven su propio perfil"
  on profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios crean su propio perfil" on profiles;
create policy "Los usuarios crean su propio perfil"
  on profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Los usuarios actualizan su propio perfil" on profiles;
create policy "Los usuarios actualizan su propio perfil"
  on profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Los usuarios borran su propio perfil" on profiles;
create policy "Los usuarios borran su propio perfil"
  on profiles for delete
  using (auth.uid() = user_id);

-- Opcional: tabla para recopilar registros de lista de espera desde la landing page
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

drop policy if exists "Permitir registro público en lista de espera" on waitlist;
create policy "Permitir registro público en lista de espera"
  on waitlist for insert
  with check (true);
