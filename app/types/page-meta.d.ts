import type { UserRole } from '~/models/user'

declare module '#app' {
  interface PageMeta {
    /** Role(s) allowed on the page. Omit to allow any signed-in user (used with the `auth` middleware). */
    role?: UserRole | UserRole[]
    /** Public page – the layout shows the footer (guests only) pinned to the bottom. */
    footer?: boolean
  }
}

export {}
