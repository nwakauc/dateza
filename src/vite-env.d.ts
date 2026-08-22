/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_D8N_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
