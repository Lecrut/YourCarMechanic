import { mapIUserProfile } from '~/mappers/userProfile'
import type { IUser } from '~/types/user'

export function mapIUser(data: Partial<IUser>): IUser {
  return {
    email: data.email || '',
    role: data.role || null,
    profile: data.profile ? mapIUserProfile(data.profile) : null,
    companyRef: data.companyRef || null,

    reference: data.reference || '',
  }
}
