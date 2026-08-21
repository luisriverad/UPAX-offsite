/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase; sin ella la app guarda solo el nombre del archivo */
  readonly VITE_SUPABASE_URL?: string
  /** llave anon (pública por diseño): lo que protege el bucket son las políticas RLS */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
