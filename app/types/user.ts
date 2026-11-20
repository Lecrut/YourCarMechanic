import type { IUserProfile } from '~/types/userProfile'

export type UserRole = 'user' | 'workshop' | 'moderator'

export interface IUser {
  email: string
  role: UserRole | null
  profile: IUserProfile | null
  companyRef: string | null

  reference: string
}
