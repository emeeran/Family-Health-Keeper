/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_HUGGING_FACE_API_KEY: string
  readonly VITE_ENCRYPTION_KEY: string
  readonly VITE_DEV_MODE: string
  readonly VITE_DEBUG_AI: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
