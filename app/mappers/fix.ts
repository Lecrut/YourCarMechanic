import { mapICar } from '~/mappers/car'
import { mapINotification } from '~/mappers/notification'
import type { ICar } from '~/types/car'
import type { IFix, IFixPhoto, IFixProposal } from '~/types/fix'

type ProposalInput = Omit<IFixProposal, 'date' | 'createdAt'> & { date: Date | string, createdAt?: Date | string }

type FixInput = Partial<Omit<IFix, 'date' | 'bookDate' | 'notifications' | 'car' | 'proposal' | 'photos'>> & {
  photos?: (Omit<IFixPhoto, 'at'> & { at: Date | string })[]
  proposal?: ProposalInput | null
  date?: Date | string
  bookDate?: Date | string
  car?: Partial<ICar>
  notifications?: Parameters<typeof mapINotification>[0][]
}

export function mapIFix(data: FixInput): IFix {
  return {
    date: new Date(data.date ?? Date.now()),
    bookDate: new Date(data.bookDate ?? Date.now()),

    companyRef: data.companyRef || '',
    car: mapICar({ ...data.car }),
    carRef: data.carRef || '',
    durationHours: Number(data.durationHours) || 1,
    slotIds: [...(data.slotIds ?? [])],
    carMillage: Number(data.carMillage || 0),
    userRef: data.userRef || '',

    services: [...(data.services ?? [])],
    description: data.description || '',
    clientPhone: data.clientPhone || '',
    clientName: data.clientName || '',
    marketingConsent: data.marketingConsent || false,

    notifications: (data.notifications ?? []).map(mapINotification),

    isClosed: data.isClosed || false,
    estimate: data.estimate ? { min: Number(data.estimate.min), max: Number(data.estimate.max) } : null,
    reviewed: data.reviewed || false,
    createdBy: data.createdBy || 'user',
    confirmed: data.confirmed ?? true,
    proposal: data.proposal
      ? {
          services: [...data.proposal.services],
          description: data.proposal.description || '',
          date: new Date(data.proposal.date),
          estimate: data.proposal.estimate ?? null,
          createdAt: new Date(data.proposal.createdAt ?? Date.now()),
        }
      : null,
    workshopNote: data.workshopNote || '',
    photos: (data.photos ?? []).map(p => ({ path: p.path, url: p.url, by: p.by, at: new Date(p.at) })),
    promotion: data.promotion ? { title: data.promotion.title || '', percent: Number(data.promotion.percent) || 0 } : null,

    reference: data.reference || '',
  }
}
