import { addDoc, collection, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './snapshot'
import { softDelete } from './softDelete'
import { notDeleted } from '~/domain/softDelete'
import { mapIPriceListItem } from '~/mappers/priceList'
import type { IPriceListItem } from '~/types/priceList'
import { mapIPromotion } from '~/mappers/promotion'
import type { IPromotion } from '~/types/promotion'

const priceList = (companyRef: string) => collection(db(), `${companyRef}/priceList`)

export async function getPriceList(companyRef: string): Promise<IPriceListItem[]> {
  return notDeleted(fromQuery<IPriceListItem>(await getDocs(priceList(companyRef))).map(mapIPriceListItem))
}

export async function savePriceListItem(companyRef: string, item: IPriceListItem): Promise<IPriceListItem> {
  const { reference, deletedAt: _deletedAt, ...data } = mapIPriceListItem(item)
  if (reference) {
    await setDoc(doc(db(), reference), data)
    return mapIPriceListItem(item)
  }
  const docRef = await addDoc(priceList(companyRef), data)
  return mapIPriceListItem({ ...data, reference: docRef.path })
}

export const deletePriceListItem = (itemRef: string) => softDelete(itemRef)

// ---- promotions (companies/{id}/promotions) ----
const promotions = (companyRef: string) => collection(db(), `${companyRef}/promotions`)

export async function getPromotions(companyRef: string): Promise<IPromotion[]> {
  return notDeleted(fromQuery<IPromotion>(await getDocs(promotions(companyRef))).map(mapIPromotion))
    .sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime())
}

export async function savePromotion(companyRef: string, promotion: IPromotion): Promise<IPromotion> {
  const { reference, deletedAt: _deletedAt, ...rest } = mapIPromotion(promotion)
  const data = { ...rest, validFrom: Timestamp.fromDate(rest.validFrom), validTo: Timestamp.fromDate(rest.validTo) }
  if (reference) {
    await setDoc(doc(db(), reference), data)
    return mapIPromotion(promotion)
  }
  const docRef = await addDoc(promotions(companyRef), data)
  return mapIPromotion({ ...rest, reference: docRef.path })
}

export const deletePromotion = (promotionRef: string) => softDelete(promotionRef)
