import type {Ref} from "vue";
import json from '../public/cities.json'

interface ICitiesFromJson {
    value: string,
    title: string,
}

export const useCitiesJsonStore = defineStore('cities-json', () => {
    const citiesFromJson: Ref<ICitiesFromJson[]> = ref([])

    const getCitiesFromJson = () => {
        citiesFromJson.value = json.map((item: any) => {
            return {value: item.value, title: item.city}
        })
    }

    const getCityName = (city: string): string => {
        return citiesFromJson.value.find(item => item.value === city)?.title || ""
    }

    return {
        citiesFromJson,
        getCitiesFromJson,
        getCityName
    }
})