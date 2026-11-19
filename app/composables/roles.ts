import type { UserRole } from '~/models/user'

type Translate = (key: string) => string

/** Roles a user can pick for themselves. `moderator` is assigned manually only. */
export const selectableRoles = (t: Translate): { title: string, value: UserRole }[] => [
  { title: t('roles.user'), value: 'user' },
  { title: t('roles.workshop'), value: 'workshop' },
]
