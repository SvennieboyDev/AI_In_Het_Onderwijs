// Kleine laag boven IndexedDB: lokale opslag in de browser van de docent.
// Twee "stores": de app-staat (één JSON-object) en afbeeldingen (Blobs).

import type { Staat } from '../types'

const DB_NAAM = 'nakijkassistent'
const STAAT = 'staat'
const AFBEELDINGEN = 'afbeeldingen'

let dbBelofte: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  dbBelofte ??= new Promise((resolve, reject) => {
    const verzoek = indexedDB.open(DB_NAAM, 1)
    verzoek.onupgradeneeded = () => {
      verzoek.result.createObjectStore(STAAT)
      verzoek.result.createObjectStore(AFBEELDINGEN)
    }
    verzoek.onsuccess = () => resolve(verzoek.result)
    verzoek.onerror = () => reject(verzoek.error)
  })
  return dbBelofte
}

async function actie<T>(store: string, modus: IDBTransactionMode, werk: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const verzoek = werk(db.transaction(store, modus).objectStore(store))
    verzoek.onsuccess = () => resolve(verzoek.result)
    verzoek.onerror = () => reject(verzoek.error)
  })
}

export const laadStaat = () => actie<Staat | undefined>(STAAT, 'readonly', (s) => s.get('staat'))
export const bewaarStaat = (staat: Staat) => actie(STAAT, 'readwrite', (s) => s.put(staat, 'staat'))

export const bewaarAfbeelding = (id: string, blob: Blob) => actie(AFBEELDINGEN, 'readwrite', (s) => s.put(blob, id))
export const laadAfbeelding = (id: string) => actie<Blob | undefined>(AFBEELDINGEN, 'readonly', (s) => s.get(id))
export const verwijderAfbeelding = (id: string) => actie(AFBEELDINGEN, 'readwrite', (s) => s.delete(id))
export const wisAlles = async () => {
  await actie(STAAT, 'readwrite', (s) => s.clear())
  await actie(AFBEELDINGEN, 'readwrite', (s) => s.clear())
}
