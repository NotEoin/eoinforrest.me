/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Formspree public form id. Set in the deploy environment, not committed.
   *  Without it the contact form renders the copy-the-address fallback. */
  readonly VITE_FORMSPREE_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
