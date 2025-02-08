import {type IWorkshop, mapIWorkshop} from "~/models/workshop";
import type {Ref} from "vue";
import type {IFreeHours, IWorkshopHours} from "~/models/workshopFreeHours";
import {convertToFutureDate} from "~/helpers/time";

const apiUrl = "http://localhost:3003/"

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
        freeHoursTable.value = []
    }

    const deleteFindResult = () => {
        workshops.value = []
        workshopsFreeTimes.value = []
    }

    const getWorkshopByRef = async (companyRef: string) => {
        sharedStore.init()

        const findWorkshop = workshops.value.find(x => x.reference === companyRef)
        if (findWorkshop) {
            sharedStore.success()
            return findWorkshop
        }

        try {
            // @ts-ignore
            const {data} = await useFetch(apiUrl + 'get-workshop', {
                query: {workshop: companyRef},
                method: 'POST',
            }) as unknown as IWorkshop

            if (data.value) {
                const mappedWorkshop = mapIWorkshop({...data.value})
                workshops.value = [...workshops.value, mappedWorkshop]
                sharedStore.success()
                return mappedWorkshop
            } else
                sharedStore.failure()
            return null
        } catch (e) {
            sharedStore.failure()
            return null
        }
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

    const getDays = (numDays: number): string[] => {
        const today = new Date();
        return Array.from({length: numDays}, (_, i) => {
            const day = new Date();
            day.setDate(today.getDate() + i + 1);
            return day.toLocaleDateString('pl-PL', {weekday: 'long', day: 'numeric', month: 'numeric'});
        });
    };


    const getHoursList = (openingHour: number, closingHour: number): number[] => {
        return Array.from({length: closingHour - openingHour}, (_, i) => openingHour + i)
    }

    const checkReservation = async (day: string, hour: string, workshop: IWorkshop): Promise<boolean> => {
        try {
            // @ts-ignore
            const {data} = await useFetch(apiUrl + 'is-fix-booked', {
                query: {
                    companyRef: workshop.reference,
                    hour: convertToFutureDate(day, hour).toISOString()
                },
                method: 'POST',
            }) as unknown as boolean

            if (data.value) {
                return data.value
            } else {
                return false
            }
        } catch (e) {
            return false
        }
    }


    const getWorkshopFreeHours = async (workshop: IWorkshop) => {
        sharedStore.init()

        const findWorkshop = workshopsFreeTimes.value.find(x => x.workshop.reference === workshop.reference)
        if (findWorkshop) {
            freeHoursTable.value = findWorkshop.data
            sharedStore.success()
            return
        }

        freeHoursTable.value = []
        const daysNumber = 6

        const days = getDays(daysNumber)

        const data = await Promise.all(days.map(async (day) => {
            const hours = await Promise.all(getHoursList(workshop.openingTime, workshop.closingTime).map(async (hour) => {
                const isBooked = await checkReservation(day, hour.toString(), workshop)
                return {hour, isBooked}
            }))
            return {day, hours}
        }))

        workshopsFreeTimes.value.push({workshop: workshop, data: [...data]})
        freeHoursTable.value = [...data]
        sharedStore.success()
    }

    const getNextFreeDays = async (workshop: IWorkshop) => {
        sharedStore.init()

        const daysNumber = 3
        const getFreeDays = workshopsFreeTimes.value.find(x => x.workshop.reference === workshop.reference)?.data

        const days = getDays(daysNumber + (getFreeDays?.length || 0))

        const data = await Promise.all(days.map(async (day) => {
            const findDay = getFreeDays?.find(x => x.day === day)
            if (findDay)
                return findDay
            const hours = await Promise.all(getHoursList(workshop.openingTime, workshop.closingTime).map(async (hour) => {
                const isBooked = await checkReservation(day, hour.toString(), workshop)
                return {hour, isBooked}
            }))
            return {day, hours}
        }))

        workshopsFreeTimes.value.map(x => x.workshop.reference === workshop.reference
            ? {
                workshop: workshop,
                data: [...data]
            }
            : x
        )
        freeHoursTable.value = [...data]
        sharedStore.success()
    }

    return {
        workshops,
        freeHoursTable,
        resetState,
        deleteFindResult,
        getWorkshopFreeHours,
        getWorkshopsByCity,
        getWorkshopByRef,
        getWorkshopsByCityAndServices,
        getNextFreeDays
    }
})