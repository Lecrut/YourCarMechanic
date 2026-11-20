import cities from '~/assets/data/cities.json'

interface ICityOption {
  value: string
  title: string
}

/** Static list of cities bundled with the app. */
export const useCitiesJsonStore = defineStore('cities-json', () => {
  const citiesFromJson = ref<ICityOption[]>([])

  function getCitiesFromJson() {
    if (!citiesFromJson.value.length)
      citiesFromJson.value = (cities as { value: string, city: string }[]).map(c => ({ value: c.value, title: c.city }))
  }

  function getCityName(city: string): string {
    getCitiesFromJson()
    if (!city) return ''
    // Unknown key (old data / typo): show it readable instead of nothing, e.g. `nowy_sacz` -> `Nowy sacz`.
    return citiesFromJson.value.find(c => c.value === city)?.title
      ?? city.charAt(0).toUpperCase() + city.slice(1).replace(/_/g, ' ')
  }

  /** City centre from the bundled list (null for unknown keys). */
  function getCityLocation(city: string): { lat: number, lng: number } | null {
    const entry = (cities as { value: string, lat?: string, lng?: string }[]).find(c => c.value === city)
    const lat = Number(entry?.lat)
    const lng = Number(entry?.lng)
    return entry && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  }

  return { citiesFromJson, getCitiesFromJson, getCityName, getCityLocation }
})
