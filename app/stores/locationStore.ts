import type { LatLng } from '~/types/geo'
import { AppError } from '~/utils/errors'

const STORAGE_KEY = 'user-location'

interface SavedLocation {
  origin: LatLng
  source: 'gps' | 'city'
  city: string | null
  radiusKm: number | null
}

/**
 * Where the user searches from: a chosen city or the browser's location (asked only after
 * the user clicks "use my location"). Remembered per browser – a convenience, not account data.
 */
export const useLocationStore = defineStore('location', () => {
  const origin = ref<LatLng | null>(null)
  const source = ref<'gps' | 'city' | null>(null)
  const city = ref<string | null>(null)
  /** null = whole country. */
  const radiusKm = ref<number | null>(50)
  const locating = ref(false)

  function save() {
    try {
      if (!origin.value || !source.value) return localStorage.removeItem(STORAGE_KEY)
      const data: SavedLocation = { origin: origin.value, source: source.value, city: city.value, radiusKm: radiusKm.value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
    catch {
      // storage unavailable – the choice just is not remembered
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as SavedLocation
      origin.value = data.origin
      source.value = data.source
      city.value = data.city
      radiusKm.value = data.radiusKm
    }
    catch {
      // ignore broken/unavailable storage
    }
  }

  function chooseCity(key: string | null) {
    const center = key ? useCitiesJsonStore().getCityLocation(key) : null
    city.value = center ? key : null
    origin.value = center
    source.value = center ? 'city' : null
    save()
  }

  /** Asks the browser for the position (the browser shows its own consent prompt). */
  function useGps(): Promise<void> {
    if (!('geolocation' in navigator)) return Promise.reject(new AppError('errors.locationUnavailable'))
    locating.value = true
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          origin.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          source.value = 'gps'
          city.value = null
          locating.value = false
          save()
          resolve()
        },
        (err) => {
          locating.value = false
          reject(new AppError(err.code === err.PERMISSION_DENIED ? 'errors.locationDenied' : 'errors.locationUnavailable'))
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      )
    })
  }

  function setRadius(km: number | null) {
    radiusKm.value = km
    save()
  }

  return { origin, source, city, radiusKm, locating, restore, chooseCity, useGps, setRadius }
})
