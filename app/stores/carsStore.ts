import { carsService, fixesService } from '~/services'
import type { ICar } from '~/types/car'

export const useCarsStore = defineStore('cars', () => {
  const cars = ref<ICar[]>([])
  const sharedStore = useSharedStore()

  function resetState() {
    cars.value = []
  }

  const getUserCars = (userRef: string) =>
    sharedStore.run(async () => {
      cars.value = await carsService.getUserCars(userRef)
    })

  const addCar = (car: ICar) =>
    sharedStore.run(async () => {
      cars.value = [...cars.value, await carsService.addCar(car)]
    })

  const updateCar = (car: ICar) =>
    sharedStore.run(async () => {
      const updated = await carsService.updateCar(car)
      cars.value = cars.value.map(c => (c.reference === updated.reference ? updated : c))
      // Upcoming visits with this car show the corrected data to the workshop.
      await fixesService.syncCarSnapshot(updated.userRef, updated)
    })

  /** Soft delete – the car disappears for the owner, repairs keep their snapshot. */
  const deleteCar = (car: ICar) =>
    sharedStore.run(async () => {
      await carsService.deleteCar(car)
      cars.value = cars.value.filter(c => c.reference !== car.reference)
    })

  return { cars, getUserCars, addCar, updateCar, deleteCar, resetState }
})
