import type { IUserProfile } from '~/types/userProfile'

export function mapIUserProfile(data: Partial<Record<keyof IUserProfile, string | null>>): IUserProfile {
  return {
    name: data.name || '',
    surname: data.surname || '',
    phone: data.phone || '',
  }
}
