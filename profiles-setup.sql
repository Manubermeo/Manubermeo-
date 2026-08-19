-- PaveDirt · tabla "profiles"
-- Guarda el perfil de ciclista + ficha técnica de la bici (todo el objeto
-- que llena SetupScreen) como JSON, uno por usuario autenticado.
-- Ejecutar en Supabase → SQL Editor.

create table if not exists profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Cada usuario solo puede leer, crear, actualizar o borrar su propia fila.
create policy "Los usuarios ven su propio perfil"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean su propio perfil"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios actualizan su propio perfil"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran su propio perfil"
  on profiles for delete
  using (auth.uid() = user_id);
