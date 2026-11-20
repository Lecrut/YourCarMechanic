import type { IWorkshop } from '~/models/workshop'
import type { IRatingSummary } from '~/models/review'

export interface LatLng {
  lat: number
  lng: number
}

/** Centre of Poland – the map's starting view before we know where the user is. */
export const POLAND_CENTER: LatLng = { lat: 52.07, lng: 19.48 }

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** "850 m", "4,2 km", "37 km". */
export function formatDistance(km: number, locale = 'pl'): string {
  if (km < 1) return `${Math.round(km * 10) * 100} m`
  const value = km < 10 ? Math.round(km * 10) / 10 : Math.round(km)
  return `${value.toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB')} km`
}

/** Small stable offset (≈ up to 1 km) so workshops without a pin do not stack on the city centre. */
function jitter(seed: string): LatLng {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0
  const angle = ((h >>> 0) % 360) * (Math.PI / 180)
  const r = 0.004 + (((h >>> 8) % 100) / 100) * 0.005
  return { lat: Math.sin(angle) * r, lng: Math.cos(angle) * r * 1.6 }
}

export interface PlacedWorkshop {
  workshop: IWorkshop
  position: LatLng
  /** True when the workshop has not pinned itself – position is its city centre. */
  approximate: boolean
}

/** Position on the map: the workshop's own pin, otherwise its city centre (marked approximate). */
export function placeWorkshop(workshop: IWorkshop, cityCenter: (city: string) => LatLng | null): PlacedWorkshop | null {
  if (workshop.location) return { workshop, position: workshop.location, approximate: false }
  const center = cityCenter(workshop.city)
  if (!center) return null
  const j = jitter(workshop.reference || workshop.name)
  return { workshop, position: { lat: center.lat + j.lat, lng: center.lng + j.lng }, approximate: true }
}

export type WorkshopSort = 'distance' | 'rating' | 'reviews'

export interface RankedWorkshop extends PlacedWorkshop {
  distance: number | null
  rating: IRatingSummary
}

/**
 * Distance + rating for each workshop, filtered by radius (when the user's location is known)
 * and sorted. Unrated workshops go after rated ones when sorting by rating.
 */
export function rankWorkshops(
  placed: PlacedWorkshop[],
  ratings: Record<string, IRatingSummary>,
  origin: LatLng | null,
  sort: WorkshopSort,
  radiusKm: number | null,
): RankedWorkshop[] {
  const ranked = placed.map(p => ({
    ...p,
    distance: origin ? distanceKm(origin, p.position) : null,
    rating: ratings[p.workshop.reference] ?? { average: 0, count: 0 },
  })).filter(r => radiusKm === null || r.distance === null || r.distance <= radiusKm)

  const byDistance = (a: RankedWorkshop, b: RankedWorkshop) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
  const compare: Record<WorkshopSort, (a: RankedWorkshop, b: RankedWorkshop) => number> = {
    distance: (a, b) => byDistance(a, b) || b.rating.average - a.rating.average,
    rating: (a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count || byDistance(a, b),
    reviews: (a, b) => b.rating.count - a.rating.count || b.rating.average - a.rating.average || byDistance(a, b),
  }
  return ranked.sort(compare[sort])
}
