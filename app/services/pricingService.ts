import { addDoc, collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { fromQuery } from './mappers'
import { softDelete } from './softDelete'
import { notDeleted } from '~/models/softDelete'
import { type IPriceListItem, mapIPriceListItem } from '~/models/priceList'

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
  const ref = await addDoc(priceList(companyRef), data)
  return mapIPriceListItem({ ...data, reference: ref.path })
}

export const deletePriceListItem = (itemRef: string) => softDelete(itemRef)
