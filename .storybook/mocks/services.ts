// In-memory stand-in for app/services (aliased in .storybook/vite.shared.ts).
// Every function is a `fn()` spy, so play tests can assert calls. Keep the exported shape
// identical to app/services/index.ts.
import { fn } from 'storybook/test'
import * as fx from './fixtures'
import type { IFix } from '~/models/fix'
import { mapIFix } from '~/models/fix'
import type { ICar } from '~/models/car'
import type { IWorkshop } from '~/models/workshop'
import type { IUser } from '~/models/user'
import type { IService } from '~/models/service'
import type { IPriceListItem } from '~/models/priceList'
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
    if (!user) throw new Error('auth/invalid-credential')
    db.currentUser = user
    return later(user)
  }).mockName('logIn'),
  logOut: fn(async () => {
    db.currentUser = null
  }).mockName('logOut'),
  resetPassword: fn(async (_email: string) => {}).mockName('resetPassword'),
  isSignedIn: fn(async () => true).mockName('isSignedIn'),
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
  getAllWorkshopFixes: fn(async (companyRef: string) => later(db.fixes.filter(f => f.companyRef === companyRef))).mockName('getAllWorkshopFixes'),
  watchActiveFixes: fn((field: 'userRef' | 'companyRef', ref: string, onChange: (f: IFix[]) => void) => {
    onChange(clone(activeFixes(field, ref)))
    return () => {}
  }).mockName('watchActiveFixes'),
  addFix: fn(async (fix: IFix) => {
    const saved = mapIFix({ ...fix, confirmed: fix.createdBy !== 'workshop', reference: newRef('fixes') })
    db.fixes.push(saved)
    db.bookedSlots.push(fix.date)
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
  confirmBooking: fn(async (fix: IFix) => {
    const updated = mapIFix({ ...fix, confirmed: true })
    db.fixes = replace(db.fixes, updated)
    return later(updated)
  }).mockName('confirmBooking'),
}

export const workshopsService = {
  getWorkshop: fn(async (ref: string) => later(db.workshops.find(w => w.reference === ref) ?? null)).mockName('getWorkshop'),
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
  setUserRole: fn(async (_ref: string, _role: IUser['role']) => {}).mockName('setUserRole'),
  deleteWorkshop: fn(async (_ref: string) => {}).mockName('deleteWorkshop'),
  restoreWorkshop: fn(async (_ref: string) => {}).mockName('restoreWorkshop'),
  setWorkshopStatus: fn(async (_ref: string, _status: IWorkshop['status']) => {}).mockName('setWorkshopStatus'),
  createWorkshop: fn(async (workshop: IWorkshop, _owner: IUser | null) => {
    const saved = { ...workshop, reference: newRef('companies') }
    db.workshops.push(saved)
    return later(saved)
  }).mockName('createWorkshop'),
}

export const pricingService = {
  getPriceList: fn(async (companyRef: string) =>
    later(db.priceList.filter(i => i.reference.startsWith(`${companyRef}/`) && !i.deletedAt))).mockName('getPriceList'),
  savePriceListItem: fn(async (companyRef: string, item: IPriceListItem) => {
    const saved = item.reference ? item : { ...item, reference: newRef(`${companyRef}/priceList`) }
    db.priceList = item.reference ? replace(db.priceList, saved) : [...db.priceList, saved]
    return later(saved)
  }).mockName('savePriceListItem'),
  deletePriceListItem: fn(async (_ref: string) => {}).mockName('deletePriceListItem'),
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
  setReviewHidden: fn(async (_ref: string, _hidden: boolean) => {}).mockName('setReviewHidden'),
  deleteReview: fn(async (_ref: string) => {}).mockName('deleteReview'),
  restoreReview: fn(async (_ref: string) => {}).mockName('restoreReview'),
}
