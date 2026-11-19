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
    return citiesFromJson.value.find(c => c.value === city)?.title ?? ''
  }

  return { citiesFromJson, getCitiesFromJson, getCityName }
})
