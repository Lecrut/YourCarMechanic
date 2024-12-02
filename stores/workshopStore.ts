import {type IWorkshop, mapIWorkshop} from "~/models/workshop";
import type {Ref} from "vue";
import type {IFreeHours, IWorkshopHours} from "~/models/workshopFreeHours";

const apiUrl = "http://localhost:5050/"

interface IWorkshopsInCity {
    city: string
    workshops: IWorkshop[]
}

export const useWorkshopStore = defineStore('workshops', () => {
    const workshops: Ref<IWorkshop[]> = ref([])
    const workshopsInCity: Ref<IWorkshopsInCity[]> = ref([])
    const workshopsFreeTimes: Ref<IWorkshopHours[]> = ref([])
    const freeHoursTable: Ref<IFreeHours[]> = ref([])

    const sharedStore = useSharedStore()

    const resetState = () => {
        workshops.value = []
        workshopsInCity.value = []
        workshopsFreeTimes.value = []
    }

    const deleteFindResult = () => {
        workshops.value = []
        workshopsFreeTimes.value = []
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

    function getDays(numDays: number): string[] {
        const today = new Date()
        return Array.from({length: numDays}, (_, i) => {
            const day = new Date(today)
            day.setDate(today.getDate() + i)
            return day.toLocaleDateString('pl-PL', {weekday: 'long', day: 'numeric', month: 'numeric'})
        });
    }

    function getHoursList(openingHour: number, closingHour: number): number[] {
        return Array.from({length: closingHour - openingHour}, (_, i) => openingHour + i)
    }

    async function checkReservation(day: string, hour: number): Promise<boolean> {
        // Zastąp przykładowym kodem, który sprawdza rezerwację z Firestore
        // Na przykładzie poniżej tylko dla ilustracji
        return false // lub true, jeśli godzina jest zarezerwowana
    }


    async function getWorkshopFreeHours(workshop: IWorkshop) {
        const findWorkshop = workshopsFreeTimes.value.find(x => x.workshop.reference === workshop.reference)
        if (findWorkshop) {
            console.log(findWorkshop)
            freeHoursTable.value = findWorkshop.data
            return
        }

        freeHoursTable.value = []

        const days = getDays(6)
        const hoursList = getHoursList(workshop.openingTime, workshop.closingTime)

        const data = await Promise.all(days.map(async (day) => {
            const hours = await Promise.all(hoursList.map(async (hour) => {
                const isBooked = await checkReservation(day, hour)
                return {hour, isBooked}
            }))
            return {day, hours}
        }))

        workshopsFreeTimes.value.push({workshop: workshop, data: [...data]})
        freeHoursTable.value = [...data]
    }

    return {
        workshops,
        freeHoursTable,
        resetState,
        deleteFindResult,
        getWorkshopFreeHours,
        getWorkshopsByCity,
        getWorkshopsByCityAndServices,
    }
})