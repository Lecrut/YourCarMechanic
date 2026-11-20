import { mapICar } from '~/models/car'
import { mapIFix } from '~/models/fix'
import { mapIUser } from '~/models/user'
import { mapIWorkshop } from '~/models/workshop'
import { mapIPriceListItem } from '~/models/priceList'
import { mapIReview } from '~/models/review'
import { DEFAULT_SERVICES } from '~/models/service'
import { mapIPromotion } from '~/models/promotion'
import { mapIContactMessage } from '~/models/contactMessage'
import { addDays, atHour } from '~/utils/time'

const tomorrow = addDays(new Date(), 1)
const daysAgo = (n: number) => addDays(new Date(), -n)

export const userAnna = mapIUser({
  email: 'anna@example.com',
  role: 'user',
  profile: { name: 'Anna', surname: 'Kowalska', phone: '600100200' },
  reference: 'users/anna',
})

export const workshopOwner = mapIUser({
  email: 'serwis@example.com',
  role: 'workshop',
  profile: { name: 'Piotr', surname: 'Nowak', phone: '600300400' },
  companyRef: 'companies/autofix',
  reference: 'users/piotr',
})

export const moderator = mapIUser({
  email: 'mod@example.com',
  role: 'moderator',
  profile: { name: 'Ola', surname: 'Moderator', phone: '600500600' },
  reference: 'users/mod',
})

export const newUser = mapIUser({ email: 'new@example.com', role: null, reference: 'users/new' })

export const autofix = mapIWorkshop({
  name: 'AutoFix Kraków',
  nip: '5260259950',
  city: 'krakow',
  address: 'ul. Długa 5',
  phone: '123456789',
  openingTime: 8,
  closingTime: 16,
  services: ['oil', 'tires', 'engine', 'electrician'],
  ownerUid: 'piotr',
  status: 'approved',
  hourlyRate: 150,
  contractSignedAt: daysAgo(30),
  location: { lat: 50.0614, lng: 19.9366 },
  reference: 'companies/autofix',
})

/** Approved Warsaw workshop for German brands only, without its own map pin (city centre is used). */
export const bavariaService = mapIWorkshop({
  name: 'Bavaria Service',
  nip: '7010001454',
  city: 'warszawa',
  address: 'ul. Grochowska 12',
  phone: '501502503',
  openingTime: 7,
  closingTime: 18,
  services: ['oil', 'engine'],
  ownerUid: 'bavaria',
  status: 'approved',
  hourlyRate: 220,
  brands: ['BMW', 'Audi', 'Mercedes-Benz'],
  reference: 'companies/bavaria',
})

export const pendingWorkshop = mapIWorkshop({
  name: 'Garage Nowy',
  nip: '1130213812',
  city: 'krakow',
  address: 'ul. Krótka 1',
  phone: '987654321',
  openingTime: 9,
  closingTime: 17,
  services: ['tires'],
  ownerUid: 'new',
  status: 'pending',
  reference: 'companies/nowy',
})

export const anniesCar = mapICar({
  manufacturer: 'BMW',
  model: 'Seria 3',
  productionYear: 2018,
  vin: 'WBA8E9G50JNU12345',
  userRef: userAnna.reference,
  reference: 'cars/bmw',
})

export const anniesSecondCar = mapICar({
  manufacturer: 'Skoda',
  model: 'Octavia',
  productionYear: 2015,
  userRef: userAnna.reference,
  reference: 'cars/skoda',
})

export const priceList = [
  mapIPriceListItem({
    serviceKey: 'oil',
    name: 'Wymiana oleju i filtra',
    laborHours: { min: 0.5, max: 1 },
    partsCost: { economy: { min: 150, max: 220 }, standard: { min: 200, max: 300 }, premium: { min: 300, max: 450 } },
    reference: 'companies/autofix/priceList/oil',
  }),
  mapIPriceListItem({
    serviceKey: 'tires',
    name: 'Wymiana opon (komplet)',
    laborHours: { min: 1, max: 1 },
    partsCost: { economy: { min: 0, max: 0 }, standard: { min: 0, max: 0 }, premium: { min: 0, max: 50 } },
    reference: 'companies/autofix/priceList/tires',
  }),
]

/** Booked by Anna, waiting for the workshop. */
export const newFix = mapIFix({
  date: atHour(addDays(tomorrow, 1), 10),
  bookDate: new Date(),
  companyRef: autofix.reference,
  car: anniesCar,
  carMillage: 120000,
  userRef: userAnna.reference,
  services: ['oil'],
  description: 'Kontrolka oleju się zapala.',
  clientPhone: '600100200',
  clientName: 'Anna Kowalska',
  marketingConsent: true,
  estimate: { min: 375, max: 600 },
  reference: 'fixes/new',
})

/** Car received, quote given, workshop proposes to add tires. */
export const fixWithProposal = mapIFix({
  ...newFix,
  date: atHour(daysAgo(1), 9),
  bookDate: daysAgo(3),
  services: ['oil'],
  notifications: [
    { notificationType: 'getCar', sendDate: daysAgo(1), date: daysAgo(1) },
    { notificationType: 'addQuote', cost: 480, sendDate: daysAgo(1), date: daysAgo(1) },
  ],
  proposal: {
    services: ['oil', 'tires'],
    description: 'Kontrolka oleju + opony są łyse, proponujemy wymianę.',
    date: atHour(daysAgo(1), 9),
    estimate: { min: 525, max: 800 },
  },
  workshopNote: 'Opony mają ok. 2 mm bieżnika – zalecamy wymianę przed zimą.',
  reference: 'fixes/proposal',
})

/** Booked by the workshop for Anna – needs her confirmation. */
export const fixBookedByWorkshop = mapIFix({
  ...newFix,
  services: ['tires'],
  description: 'Sezonowa wymiana opon – promocja.',
  createdBy: 'workshop',
  confirmed: false,
  estimate: { min: 150, max: 200 },
  reference: 'fixes/byWorkshop',
})

/** Finished, not yet reviewed. */
export const finishedFix = mapIFix({
  ...newFix,
  date: atHour(daysAgo(10), 12),
  bookDate: daysAgo(14),
  car: anniesSecondCar,
  services: ['tires'],
  isClosed: true,
  notifications: [
    { notificationType: 'getCar', sendDate: daysAgo(10), date: atHour(daysAgo(10), 12) },
    { notificationType: 'addQuote', cost: 180, sendDate: daysAgo(10), date: atHour(daysAgo(10), 13) },
    { notificationType: 'giveBackCar', sendDate: daysAgo(9), date: atHour(daysAgo(9), 15) },
  ],
  reference: 'fixes/finished',
})

export const cancelledFix = mapIFix({
  ...newFix,
  date: atHour(daysAgo(40), 8),
  bookDate: daysAgo(45),
  isClosed: true,
  notifications: [{ notificationType: 'userCancel', sendDate: daysAgo(41), date: daysAgo(41) }],
  reference: 'fixes/cancelled',
})

export const reviews = [
  mapIReview({
    companyRef: autofix.reference,
    fixRef: 'fixes/old1',
    userRef: userAnna.reference,
    authorName: 'Anna K.',
    rating: 5,
    comment: 'Szybko i solidnie!',
    createdAt: daysAgo(20),
    reference: 'reviews/old1',
  }),
  mapIReview({
    companyRef: autofix.reference,
    fixRef: 'fixes/old2',
    userRef: 'users/jan',
    authorName: 'Jan W.',
    rating: 2,
    comment: 'Długo czekałem na auto.',
    createdAt: daysAgo(5),
    reference: 'reviews/old2',
  }),
]

export const services = DEFAULT_SERVICES

export const promotions = [
  mapIPromotion({
    title: 'Jesienna wymiana opon',
    services: ['tires'],
    percent: 20,
    validFrom: daysAgo(5),
    validTo: addDays(new Date(), 20),
    reference: 'companies/autofix/promotions/autumn',
  }),
]

export const contactMessages = [
  mapIContactMessage({
    name: 'Jan Wiśniewski',
    email: 'jan@example.com',
    category: 'booking',
    subject: 'Nie mogę odwołać wizyty',
    message: 'Dzień dobry, przycisk odwołania jest nieaktywny, a wizyta jest jutro.',
    status: 'new',
    createdAt: daysAgo(1),
    reference: 'contactMessages/m1',
  }),
  mapIContactMessage({
    name: 'Serwis Nowak',
    email: 'serwis@example.com',
    category: 'workshop',
    subject: 'Podpisanie umowy',
    message: 'Chcielibyśmy dołączyć do aplikacji – jak wygląda podpisanie umowy?',
    status: 'inProgress',
    userRef: 'users/piotr',
    moderatorNote: 'Wysłano wzór umowy.',
    createdAt: daysAgo(3),
    reference: 'contactMessages/m2',
  }),
  mapIContactMessage({
    name: 'Ola',
    email: 'ola@example.com',
    category: 'other',
    subject: 'Dziękuję',
    message: 'Świetna aplikacja, wszystko działa.',
    status: 'resolved',
    createdAt: daysAgo(10),
    reference: 'contactMessages/m3',
  }),
]
