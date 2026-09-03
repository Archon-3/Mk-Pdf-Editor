/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_ADSENSE_CLIENT_ID?: string
  readonly VITE_ADSENSE_SLOT_HOME?: string
  readonly VITE_ADSENSE_SLOT_PRICING?: string
  readonly VITE_ADSENSE_SLOT_SUPPORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
