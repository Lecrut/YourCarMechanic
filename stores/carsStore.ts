import type {ICar} from "~/models/car";
import type {Ref} from "vue";
import type {IUser} from "~/models/user";

export const useCarsStore = defineStore("cars", () => {
    const cars: Ref<ICar[]> = ref([])

    const sharedStore = useSharedStore()
    const resetState = () => {
        cars.value = []
    }

    const addCar = async (car: ICar) => {
        sharedStore.init()

        try {

            sharedStore.success()
        } catch (e) {
            sharedStore.failure()
        }
    }

    const getUserCars = async (user: IUser) => {
        sharedStore.init()

        try {

            sharedStore.success()
        } catch (e) {
            sharedStore.failure()
        }
    }

    const updateCar = async (car: ICar) => {
        sharedStore.init()

        try {

            sharedStore.success()
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
})