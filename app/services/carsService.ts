import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './mappers'
import { softDelete } from './softDelete'
import { type ICar, mapICar } from '~/models/car'
import { notDeleted } from '~/models/softDelete'

const cars = () => collection(db(), 'cars')

export async function getUserCars(userRef: string): Promise<ICar[]> {
  const snap = await getDocs(query(cars(), where('userRef', '==', userRef)))
  return notDeleted(fromQuery<ICar>(snap).map(mapICar))
}

export async function addCar(car: ICar): Promise<ICar> {
  const { reference: _reference, deletedAt: _deletedAt, ...data } = mapICar(car)
  const ref = await addDoc(cars(), { ...data, createTime: serverTimestamp() })
  return mapICar({ ...data, reference: ref.path })
}

export async function updateCar(car: ICar): Promise<ICar> {
  const { manufacturer, model, productionYear, vin } = mapICar(car)
  await updateDoc(doc(db(), car.reference), { manufacturer, model, productionYear, vin })
  return mapICar(car)
}

/** Soft delete – past repairs keep their own snapshot of the car anyway. */
export const deleteCar = (car: ICar) => softDelete(car.reference)
