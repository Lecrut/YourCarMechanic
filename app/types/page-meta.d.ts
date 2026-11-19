import type { UserRole } from '~/models/user'

declare module '#app' {
  interface PageMeta {
    /** Role(s) allowed on the page. Omit to allow any signed-in user (used with the `auth` middleware). */
    role?: UserRole | UserRole[]
  }
}

export {}
