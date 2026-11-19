import { type IUserProfile, mapIUserProfile } from '~/models/userProfile'

export type UserRole = 'user' | 'workshop' | 'moderator'

export interface IUser {
  email: string
  role: UserRole | null
  profile: IUserProfile | null
  companyRef: string | null

  reference: string
}

export function mapIUser(data: Partial<IUser>): IUser {
  return {
    email: data.email || '',
    role: data.role || null,
    profile: data.profile ? mapIUserProfile(data.profile) : null,
    companyRef: data.companyRef || null,

    reference: data.reference || '',
  }
}
