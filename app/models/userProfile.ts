export interface IUserProfile {
  name: string
  surname: string
  phone: string
}

export function mapIUserProfile(data: Partial<Record<keyof IUserProfile, string | null>>): IUserProfile {
  return {
    name: data.name || '',
    surname: data.surname || '',
    phone: data.phone || '',
  }
}
