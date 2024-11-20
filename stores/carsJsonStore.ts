import type {Ref} from "vue";
import json from '../public/cars.json'

interface ICarsFromJson {
    brand: string,
    models: string[],
}

export const useCarsJsonStore = defineStore('cars-json', () => {
    const carsFromJson: Ref<ICarsFromJson[]> = ref([])

    const getCarsFromJson = () => {
        carsFromJson.value = json
    }

    return {
        carsFromJson,
        getCarsFromJson,
    }
})