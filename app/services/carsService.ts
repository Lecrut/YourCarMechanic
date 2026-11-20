import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './snapshot'
import { softDelete } from './softDelete'
import { mapICar } from '~/mappers/car'
import type { ICar } from '~/types/car'
import { notDeleted } from '~/domain/softDelete'

const cars = () => collection(db(), 'cars')

export async function getUserCars(userRef: string): Promise<ICar[]> {
  const snap = await getDocs(query(cars(), where('userRef', '==', userRef)))
  return notDeleted(fromQuery<ICar>(snap).map(mapICar))
}

export async function addCar(car: ICar): Promise<ICar> {
  const { reference: _reference, deletedAt: _deletedAt, ...data } = mapICar(car)
  const docRef = await addDoc(cars(), { ...data, createTime: serverTimestamp() })
  return mapICar({ ...data, reference: docRef.path })
}

export async function updateCar(car: ICar): Promise<ICar> {
  const { manufacturer, model, productionYear, vin } = mapICar(car)
  await updateDoc(doc(db(), car.reference), { manufacturer, model, productionYear, vin })
  return mapICar(car)
}

/** Soft delete – past repairs keep their own snapshot of the car anyway. */
export const deleteCar = (car: ICar) => softDelete(car.reference)
