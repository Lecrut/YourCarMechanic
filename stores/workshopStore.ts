import {type IWorkshop, mapIWorkshop} from "~/models/workshop";
import type {Ref} from "vue";

const apiUrl = "http://localhost:5050/"

interface IWorkshopsInCity {
    city: string
    workshops: IWorkshop[]
}

export const useWorkshopStore = defineStore('workshops', () => {
    const workshops: Ref<IWorkshop[]> = ref([])
    const workshopsInCity: Ref<IWorkshopsInCity[]> = ref([])

    const sharedStore = useSharedStore()

    const resetState = () => {
        workshops.value = []
        workshopsInCity.value = []
    }

    const getWorkshopsByCityAndServices = async (city: string, services: string[]) => {
        await getWorkshopsByCity(city).then((_) =>
            workshops.value = workshops.value.filter((item) => {
                return services.every(service => item.services.includes(service))
            })
        )
    }

    const getWorkshopsByCity = async (city: string) => {
        sharedStore.init()


        const findWorkshops = workshopsInCity.value.find(item => item.city === city)
        if (findWorkshops) {
            workshops.value = findWorkshops.workshops
            sharedStore.success()
        } else {
            try {
                // @ts-ignore
                const {data} = await useFetch(apiUrl + 'get-workshop-in-city', {
                    query: {city: city},
                    method: 'POST',
                }) as unknown as IWorkshop

                if (data.value) {
                    workshops.value = data.value.map(mapIWorkshop)

                    workshopsInCity.value = [
                        ...workshopsInCity.value,
                        {
                            city: city,
                            workshops: [...workshops.value],
                        }
                    ]
                    sharedStore.success()
                } else {
                    workshops.value = []
                    sharedStore.failure()
                }
            } catch (e) {
                workshops.value = []
                sharedStore.failure()
            }
        }
    }

    return {
        workshops,
        resetState,
        getWorkshopsByCity,
        getWorkshopsByCityAndServices,
    }
})