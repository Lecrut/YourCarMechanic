import {type ICar, mapICar, mapICarToFirebase} from "~/models/car";
import type {Ref} from "vue";
import type {IUser} from "~/models/user";

const authApiUrl = "http://localhost:5050/"

export const useCarsStore = defineStore("cars", () => {
        const cars: Ref<ICar[]> = ref([])

        const sharedStore = useSharedStore()
        const resetState = () => {
            cars.value = []
        }

        const addCar = async (car: ICar) => {
            sharedStore.init()

            try {
                const queryParam = encodeURIComponent(JSON.stringify(mapICarToFirebase(car)))
                // @ts-ignore
                const {data} = await useFetch(authApiUrl + 'add-car', {
                    query: {car: queryParam},
                    method: 'POST',
                }) as unknown as ICar

                if (data.value) {
                    cars.value = [...cars.value, mapICar(data.value)]
                    sharedStore.success()
                } else {
                    sharedStore.failure()
                }
            } catch (e) {
                sharedStore.failure()
            }
        }

        const getUserCars = async (user: IUser) => {
            sharedStore.init()

            try {
                // @ts-ignore
                const {data} = await useFetch(authApiUrl + 'get-user-cars', {
                    query: {userRef: user.reference},
                    method: 'POST',
                }) as unknown as ICar[]
                if (data.value) {
                    cars.value = data.value.map(mapICar)
                    sharedStore.success()
                } else {
                    sharedStore.failure()
                }
            } catch (e) {
                sharedStore.failure()
            }
        }

        const updateCar = async (car: ICar) => {
            sharedStore.init()

            try {
                const queryParam = encodeURIComponent(JSON.stringify(mapICar(car)))
                // @ts-ignore
                const {data} = await useFetch(authApiUrl + 'update-car', {
                    query: {car: queryParam},
                    method: 'POST',
                }) as unknown as ICar

                if (data.value) {
                    cars.value = cars.value.map(newCar => car.reference === newCar.reference ? car : newCar);
                    sharedStore.success()
                } else {
                    sharedStore.failure()
                }
            } catch (e) {
                sharedStore.failure()
            }
        }

        return {
            cars,

            addCar,
            getUserCars,
            resetState,
            updateCar,
        }
    }, {persist: true}
)