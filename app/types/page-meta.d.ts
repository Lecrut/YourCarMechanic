import type { UserRole } from '~/types/user'

declare module '#app' {
  interface PageMeta {
    /** Role(s) allowed on the page. Omit to allow any signed-in user (used with the `auth` middleware). */
    role?: UserRole | UserRole[]
  }
}

export {}
