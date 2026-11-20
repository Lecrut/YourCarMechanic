import type { ICar } from '~/types/car'
import type { IClient } from '~/types/client'
import type { IFix } from '~/types/fix'

const carKey = (car: ICar) => `${car.manufacturer}|${car.model}|${car.productionYear}|${car.vin}`

export function buildClients(fixes: IFix[]): IClient[] {
  const byUser = new Map<string, IClient>()
  const sorted = [...fixes].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const fix of sorted) {
    const client = byUser.get(fix.userRef) ?? {
      userRef: fix.userRef,
      name: '',
      phone: '',
      cars: [],
      services: [],
      visits: 0,
      lastVisit: fix.date,
      marketingConsent: false,
    }

    client.visits++
    client.lastVisit = fix.date
    client.name = fix.clientName || client.name
    client.phone = fix.clientPhone || client.phone
    client.marketingConsent = fix.marketingConsent
    if (!client.cars.some(c => carKey(c) === carKey(fix.car))) client.cars.push(fix.car)
    for (const s of fix.services) if (!client.services.includes(s)) client.services.push(s)

    byUser.set(fix.userRef, client)
  }

  return [...byUser.values()].sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime())
}
