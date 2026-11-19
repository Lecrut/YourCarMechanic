import cars from '~/assets/data/cars.json'

interface ICarsFromJson {
  brand: string
  models: string[]
}

/** Static list of car brands/models bundled with the app. */
export const useCarsJsonStore = defineStore('cars-json', () => {
  const carsFromJson = ref<ICarsFromJson[]>([])

  function getCarsFromJson() {
    if (!carsFromJson.value.length) carsFromJson.value = cars
  }

  return { carsFromJson, getCarsFromJson }
})
