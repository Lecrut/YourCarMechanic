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

  return { citiesFromJson, getCitiesFromJson, getCityName }
})
