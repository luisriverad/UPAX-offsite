-- Almacenamiento de los archivos que entregan los DGs (pantalla 03).
-- Se corre una sola vez en el SQL Editor del proyecto de Supabase.
--
-- Solo se usa Storage: el estado de la app sigue en localStorage. Aquí no hay
-- tablas de negocio, únicamente el bucket y quién puede tocarlo.

-- 1. El bucket. Privado: los archivos no se sirven por URL pública, se abren
--    con URLs firmadas de una hora que pide la app.
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

-- 2. Políticas de acceso.
--
--    ADVERTENCIA: la app no tiene login, así que quien alcance la llave anon
--    —que viaja en el navegador— puede subir, leer y borrar en este bucket.
--    Es aceptable mientras la URL de la app sea interna. Si los entregables de
--    UPAX no pueden quedar así, hay que montar Supabase Auth y cambiar
--    `to anon` por `to authenticated` en las cuatro políticas de abajo.

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
