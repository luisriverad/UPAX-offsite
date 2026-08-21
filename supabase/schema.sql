-- UPAX Off-Site · esquema Supabase
-- Se corre una sola vez en el SQL Editor del proyecto.
--
-- 1) Storage: archivos de los DGs y PDFs de entrevista (bucket privado).
-- 2) app_state: una sola fila compartida con TODO el store de la app
--    (opción A: todos los dispositivos ven y editan la misma sesión).
--
-- Sin login: quien tenga la llave anon puede leer/escribir. Aceptable mientras
-- la URL sea interna. Si eso no basta, hay que montar Auth.

/* ------------------------------------------------------------------ *
 * Storage · entregables y PDFs
 * ------------------------------------------------------------------ */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dg-archivos',
  'dg-archivos',
  false,
  26214400, -- 25 MB, el mismo tope que valida el navegador
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/octet-stream'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dg archivos leer" on storage.objects;
drop policy if exists "dg archivos subir" on storage.objects;
drop policy if exists "dg archivos reemplazar" on storage.objects;
drop policy if exists "dg archivos borrar" on storage.objects;

create policy "dg archivos leer"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'dg-archivos');

create policy "dg archivos subir"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'dg-archivos');

create policy "dg archivos reemplazar"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'dg-archivos')
  with check (bucket_id = 'dg-archivos');

create policy "dg archivos borrar"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'dg-archivos');

/* ------------------------------------------------------------------ *
 * Sesión compartida · una fila para todos los dispositivos
 * ------------------------------------------------------------------ */

create table if not exists public.app_state (
  id text primary key default 'default',
  values jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint app_state_singleton check (id = 'default')
);

insert into public.app_state (id, values, version)
values ('default', '{}'::jsonb, 0)
on conflict (id) do nothing;

alter table public.app_state enable row level security;

drop policy if exists "app_state leer" on public.app_state;
drop policy if exists "app_state crear" on public.app_state;
drop policy if exists "app_state actualizar" on public.app_state;

create policy "app_state leer"
  on public.app_state for select
  to anon, authenticated
  using (true);

create policy "app_state crear"
  on public.app_state for insert
  to anon, authenticated
  with check (id = 'default');

create policy "app_state actualizar"
  on public.app_state for update
  to anon, authenticated
  using (true)
  with check (id = 'default');

-- Realtime: para que otro dispositivo vea los cambios sin recargar
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
end $$;
