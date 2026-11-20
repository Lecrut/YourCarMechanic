// In-memory stand-in for app/services (aliased in .storybook/vite.shared.ts).
// Every function is a `fn()` spy, so play tests can assert calls. Keep the exported shape
// identical to app/services/index.ts.
import { fn } from 'storybook/test'
import * as fx from './fixtures'
import type { IFix } from '~/models/fix'
import { mapIFix } from '~/models/fix'
import type { ICar } from '~/models/car'
import { type IWorkshop, occupiedHours } from '~/models/workshop'
import type { IUser } from '~/models/user'
import type { IService } from '~/models/service'
import type { IPriceListItem } from '~/models/priceList'
import type { IPromotion } from '~/models/promotion'
import { type IContactMessage, mapIContactMessage } from '~/models/contactMessage'
import { mapIReview, type IReview } from '~/models/review'
import { CLOSING_NOTIFICATIONS, type INotification } from '~/models/notification'
import type { IUserProfile } from '~/models/userProfile'

interface Db {
  currentUser: IUser | null
  users: IUser[]
  workshops: IWorkshop[]
  cars: ICar[]
  fixes: IFix[]
  services: IService[]
  priceList: IPriceListItem[]
  reviews: IReview[]
  bookedSlots: Date[]
  internalNotes: Record<string, string>
  promotions: IPromotion[]
  contactMessages: IContactMessage[]
}

const initial = (): Db => ({
  currentUser: null,
  users: [fx.userAnna, fx.workshopOwner, fx.moderator, fx.newUser],
  workshops: [fx.autofix, fx.pendingWorkshop],
  cars: [fx.anniesCar, fx.anniesSecondCar],
  fixes: [fx.newFix, fx.fixWithProposal, fx.fixBookedByWorkshop, fx.finishedFix, fx.cancelledFix],
  services: [...fx.services],
  priceList: [...fx.priceList],
  reviews: [...fx.reviews],
  bookedSlots: [fx.newFix.date],
  promotions: [...fx.promotions],
  contactMessages: [...fx.contactMessages],
  internalNotes: { [fx.fixWithProposal.reference]: 'Klient prosił o telefon przed wymianą opon.' },
})

export const db: Db = initial()

/** Called before every story (see preview.ts) so stories never leak state into each other. */
export function resetDb(overrides: Partial<Db> = {}) {
  Object.assign(db, initial(), overrides)
}

/** Deep copy that also works on Vue reactive proxies (structuredClone does not). */
function clone<T>(value: T): T {
  if (value instanceof Date) return new Date(value) as T
  if (Array.isArray(value)) return value.map(clone) as T
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) as T
  return value
}

/** Async like Firestore, returning a copy so components never share objects with the fake DB. */
const later = <T>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(clone(value)), 0))
let seq = 0
const newRef = (collection: string) => `${collection}/mock-${++seq}`
const replace = <T extends { reference: string }>(list: T[], item: T) => list.map(i => (i.reference === item.reference ? item : i))

export const initFirebase = fn().mockName('initFirebase')

export const authService = {
  signUp: fn(async (email: string) => {
    db.currentUser = { email, role: null, profile: null, companyRef: null, reference: newRef('users') }
    return later(db.currentUser)
  }).mockName('signUp'),
  logIn: fn(async (email: string, _password: string) => {
    const user = db.users.find(u => u.email === email)
    if (!user) throw Object.assign(new Error('Firebase: invalid credential'), { code: 'auth/invalid-credential' })
    db.currentUser = user
    return later(user)
  }).mockName('logIn'),
  logOut: fn(async () => {
    db.currentUser = null
  }).mockName('logOut'),
  resetPassword: fn(async (_email: string) => {}).mockName('resetPassword'),
  isSignedIn: fn(async () => true).mockName('isSignedIn'),
  isEmailVerified: fn(async () => true).mockName('isEmailVerified'),
  resendVerification: fn(async () => {}).mockName('resendVerification'),
  loadCurrentUser: fn(async () => later(db.currentUser)).mockName('loadCurrentUser'),
  onAuthChange: fn((_cb: (uid: string | null) => void) => () => {}).mockName('onAuthChange'),
  watchUser: fn((_uid: string, _cb: (u: IUser | null) => void) => () => {}).mockName('watchUser'),
  updateProfile: fn(async (userRef: string, profile: IUserProfile, role: IUser['role']) => {
    const user = { ...db.users.find(u => u.reference === userRef)!, profile, role: role ?? 'user' as const }
    db.users = replace(db.users, user)
    return later(user)
  }).mockName('updateProfile'),
  setWorkshopOwner: fn(async (userRef: string, companyRef: string) =>
    later({ ...db.users.find(u => u.reference === userRef)!, role: 'workshop' as const, companyRef })).mockName('setWorkshopOwner'),
}

export const carsService = {
  getUserCars: fn(async (userRef: string) => later(db.cars.filter(c => c.userRef === userRef && !c.deletedAt))).mockName('getUserCars'),
  addCar: fn(async (car: ICar) => {
    const saved = { ...car, reference: newRef('cars') }
    db.cars.push(saved)
    return later(saved)
  }).mockName('addCar'),
  updateCar: fn(async (car: ICar) => {
    db.cars = replace(db.cars, car)
    return later(car)
  }).mockName('updateCar'),
  deleteCar: fn(async (car: ICar) => {
    db.cars = replace(db.cars, { ...car, deletedAt: new Date() })
  }).mockName('deleteCar'),
}

const activeFixes = (field: 'userRef' | 'companyRef', ref: string) => db.fixes.filter(f => f[field] === ref && !f.isClosed)

export const fixesService = {
  getUserClosedFixes: fn(async (userRef: string) => later(db.fixes.filter(f => f.userRef === userRef && f.isClosed))).mockName('getUserClosedFixes'),
  getWorkshopClosedFixes: fn(async (companyRef: string) => later(db.fixes.filter(f => f.companyRef === companyRef && f.isClosed))).mockName('getWorkshopClosedFixes'),
  getAllUserFixes: fn(async (userRef: string) => later(db.fixes.filter(f => f.userRef === userRef))).mockName('getAllUserFixes'),
  getAllWorkshopFixes: fn(async (companyRef: string) => later(db.fixes.filter(f => f.companyRef === companyRef))).mockName('getAllWorkshopFixes'),
  watchActiveFixes: fn((field: 'userRef' | 'companyRef', ref: string, onChange: (f: IFix[]) => void) => {
    onChange(clone(activeFixes(field, ref)))
    return () => {}
  }).mockName('watchActiveFixes'),
  watchRecentFixes: fn((field: 'userRef' | 'companyRef', ref: string, _since: Date, onChange: (f: IFix[]) => void) => {
    onChange(clone(db.fixes.filter(f => f[field] === ref)))
    return () => {}
  }).mockName('watchRecentFixes'),
  addFix: fn(async (fix: IFix) => {
    const workshop = db.workshops.find(w => w.reference === fix.companyRef)!
    const hours = occupiedHours(workshop, fix.date, fix.durationHours)
    const saved = mapIFix({ ...fix, slotIds: hours.map(h => `${h.toISOString()}_0`), confirmed: fix.createdBy !== 'workshop', reference: newRef('fixes') })
    db.fixes.push(saved)
    db.bookedSlots.push(...hours)
    return later(saved)
  }).mockName('addFix'),
  addNotification: fn(async (fix: IFix, notification: INotification) => {
    const updated = mapIFix({
      ...fix,
      notifications: [...fix.notifications, notification],
      isClosed: CLOSING_NOTIFICATIONS.includes(notification.notificationType),
    })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('addNotification'),
  proposeChange: fn(async (fix: IFix, proposal: Omit<NonNullable<IFix['proposal']>, 'createdAt'>, _note: string) => {
    const updated = mapIFix({ ...fix, proposal: { ...proposal, createdAt: new Date() } })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('proposeChange'),
  acceptProposal: fn(async (fix: IFix) => {
    const p = fix.proposal!
    const updated = mapIFix({ ...fix, services: p.services, description: p.description, date: p.date, estimate: p.estimate, proposal: null })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('acceptProposal'),
  rejectProposal: fn(async (fix: IFix) => {
    const updated = mapIFix({ ...fix, proposal: null })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('rejectProposal'),
  setPublicNote: fn(async (fix: IFix, text: string) => {
    const updated = mapIFix({ ...fix, workshopNote: text })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('setPublicNote'),
  getInternalNote: fn(async (fixRef: string) => later(db.internalNotes[fixRef] ?? '')).mockName('getInternalNote'),
  setInternalNote: fn(async (fixRef: string, text: string) => {
    db.internalNotes[fixRef] = text
  }).mockName('setInternalNote'),
  syncClientContact: fn(async (userRef: string, clientName: string, clientPhone: string) => {
    db.fixes = db.fixes.map(f => (f.userRef === userRef && !f.isClosed ? mapIFix({ ...f, clientName, clientPhone }) : f))
  }).mockName('syncClientContact'),
  syncCarSnapshot: fn(async (userRef: string, car: ICar) => {
    db.fixes = db.fixes.map(f => (f.userRef === userRef && !f.isClosed && f.carRef === car.reference && !f.notifications.length ? mapIFix({ ...f, car }) : f))
  }).mockName('syncCarSnapshot'),
  rescheduleByClient: fn(async (fix: IFix, date: Date) => {
    const updated = mapIFix({ ...fix, date, notifications: [...fix.notifications, { notificationType: 'rescheduled', date, sendDate: new Date() }] })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('rescheduleByClient'),
  confirmBooking: fn(async (fix: IFix) => {
    const updated = mapIFix({ ...fix, confirmed: true })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('confirmBooking'),
}

export const workshopsService = {
  getWorkshop: fn(async (ref: string) => later(db.workshops.find(w => w.reference === ref) ?? null)).mockName('getWorkshop'),
  getApprovedWorkshops: fn(async () =>
    later(db.workshops.filter(w => w.status === 'approved' && !w.deletedAt))).mockName('getApprovedWorkshops'),
  getWorkshopsInCity: fn(async (city: string) =>
    later(db.workshops.filter(w => w.city === city && w.status === 'approved' && !w.deletedAt))).mockName('getWorkshopsInCity'),
  addWorkshop: fn(async (workshop: IWorkshop, ownerUid: string) => {
    const saved = { ...workshop, ownerUid, status: 'pending' as const, reference: newRef('companies') }
    db.workshops.push(saved)
    return later(saved)
  }).mockName('addWorkshop'),
  updateWorkshop: fn(async (workshop: IWorkshop) => {
    db.workshops = replace(db.workshops, workshop)
    return later(workshop)
  }).mockName('updateWorkshop'),
  watchWorkshop: fn((_ref: string, _cb: (w: IWorkshop | null) => void) => () => {}).mockName('watchWorkshop'),
  watchBookedSlots: fn((_ref: string, _from: Date, _to: Date, onChange: (slots: Date[]) => void) => {
    onChange([...db.bookedSlots])
    return () => {}
  }).mockName('watchBookedSlots'),
}

export const servicesCatalogService = {
  getServices: fn(async () => later(db.services)).mockName('getServices'),
  saveService: fn(async (service: IService) => {
    db.services = db.services.some(s => s.key === service.key)
      ? db.services.map(s => (s.key === service.key ? service : s))
      : [...db.services, service]
    return later(service)
  }).mockName('saveService'),
  deleteService: fn(async (_key: string) => {}).mockName('deleteService'),
  restoreService: fn(async (_key: string) => {}).mockName('restoreService'),
  seedServices: fn(async (list: IService[]) => {
    db.services = [...list]
  }).mockName('seedServices'),
}

export const moderatorService = {
  getAllUsers: fn(async () => later(db.users)).mockName('getAllUsers'),
  getAllWorkshops: fn(async () => later(db.workshops)).mockName('getAllWorkshops'),
  getAllFixes: fn(async () => later(db.fixes)).mockName('getAllFixes'),
  getAllCars: fn(async () => later(db.cars)).mockName('getAllCars'),
  watchAll: fn((handlers: {
    onUsers: (users: IUser[]) => void
    onWorkshops: (workshops: IWorkshop[]) => void
    onFixes: (fixes: IFix[]) => void
    onCars: (cars: ICar[]) => void
  }) => {
    handlers.onUsers(db.users)
    handlers.onWorkshops(db.workshops)
    handlers.onFixes(db.fixes)
    handlers.onCars(db.cars)
    return () => {}
  }).mockName('watchAll'),
  setUserRole: fn(async (_ref: string, _role: IUser['role']) => {}).mockName('setUserRole'),
  deleteWorkshop: fn(async (_ref: string) => {}).mockName('deleteWorkshop'),
  restoreWorkshop: fn(async (_ref: string) => {}).mockName('restoreWorkshop'),
  cancelOpenFixes: fn(async (companyRef: string, reason: string) => {
    const open = db.fixes.filter(f => f.companyRef === companyRef && !f.isClosed)
    db.fixes = db.fixes.map(f => (open.includes(f)
      ? mapIFix({ ...f, isClosed: true, notifications: [...f.notifications, { notificationType: 'moderatorCancel', description: reason, sendDate: new Date(), date: new Date() }] })
      : f))
    return open.length
  }).mockName('cancelOpenFixes'),
  setWorkshopStatus: fn(async (_ref: string, _status: IWorkshop['status']) => {}).mockName('setWorkshopStatus'),
  createWorkshop: fn(async (workshop: IWorkshop, _owner: IUser | null, _ownerEmail?: string | null) => {
    const saved = { ...workshop, reference: newRef('companies') }
    db.workshops.push(saved)
    return later(saved)
  }).mockName('createWorkshop'),
}

export const pricingService = {
  getPriceList: fn(async (companyRef: string) =>
    later(db.priceList.filter(i => i.reference.startsWith(`${companyRef}/`) && !i.deletedAt))).mockName('getPriceList'),
  getPromotions: fn(async (companyRef: string) =>
    later(db.promotions.filter(p => p.reference.startsWith(`${companyRef}/`) && !p.deletedAt))).mockName('getPromotions'),
  savePromotion: fn(async (companyRef: string, promotion: IPromotion) => {
    const saved = promotion.reference ? promotion : { ...promotion, reference: newRef(`${companyRef}/promotions`) }
    db.promotions = promotion.reference ? replace(db.promotions, saved) : [...db.promotions, saved]
    return later(saved)
  }).mockName('savePromotion'),
  deletePromotion: fn(async (_ref: string) => {}).mockName('deletePromotion'),
  savePriceListItem: fn(async (companyRef: string, item: IPriceListItem) => {
    const saved = item.reference ? item : { ...item, reference: newRef(`${companyRef}/priceList`) }
    db.priceList = item.reference ? replace(db.priceList, saved) : [...db.priceList, saved]
    return later(saved)
  }).mockName('savePriceListItem'),
  deletePriceListItem: fn(async (_ref: string) => {}).mockName('deletePriceListItem'),
}

export const photosService = {
  uploadPhoto: fn(async (fix: IFix, image: Blob, by: 'user' | 'workshop' | 'moderator') => {
    const photo = { path: `fixes/${fix.reference.split('/').pop()}/photos/mock-${++seq}.jpg`, url: URL.createObjectURL(image), by, at: new Date() }
    db.fixes = db.fixes.map(f => (f.reference === fix.reference ? mapIFix({ ...f, photos: [...f.photos, photo] }) : f))
    return later(photo)
  }).mockName('uploadPhoto'),
}

export const contactService = {
  sendContactMessage: fn(async (input: { name: string, email: string, category: IContactMessage['category'], subject: string, message: string, userRef: string }) => {
    db.contactMessages = [mapIContactMessage({ ...input, reference: newRef('contactMessages') }), ...db.contactMessages]
  }).mockName('sendContactMessage'),
  watchContactMessages: fn((onChange: (list: IContactMessage[]) => void) => {
    onChange(clone(db.contactMessages))
    return () => {}
  }).mockName('watchContactMessages'),
  setContactStatus: fn(async (_ref: string, _status: IContactMessage['status']) => {}).mockName('setContactStatus'),
  setContactNote: fn(async (_ref: string, _note: string) => {}).mockName('setContactNote'),
  deleteContactMessage: fn(async (_ref: string) => {}).mockName('deleteContactMessage'),
  restoreContactMessage: fn(async (_ref: string) => {}).mockName('restoreContactMessage'),
}

export const reviewsService = {
  addReview: fn(async (fix: IFix, rating: number, comment: string, authorName: string) => {
    const review = mapIReview({ companyRef: fix.companyRef, fixRef: fix.reference, userRef: fix.userRef, rating, comment, authorName, reference: newRef('reviews') })
    db.reviews.push(review)
    return later(review)
  }).mockName('addReview'),
  getReviewsForWorkshops: fn(async (refs: string[]) =>
    later(db.reviews.filter(r => refs.includes(r.companyRef) && !r.hidden && !r.deletedAt))).mockName('getReviewsForWorkshops'),
  getAllReviews: fn(async () => later(db.reviews)).mockName('getAllReviews'),
  watchAllReviews: fn((onChange: (reviews: IReview[]) => void) => {
    onChange(db.reviews)
    return () => {}
  }).mockName('watchAllReviews'),
  setReviewHidden: fn(async (_ref: string, _hidden: boolean) => {}).mockName('setReviewHidden'),
  deleteReview: fn(async (_ref: string) => {}).mockName('deleteReview'),
  restoreReview: fn(async (_ref: string) => {}).mockName('restoreReview'),
}
