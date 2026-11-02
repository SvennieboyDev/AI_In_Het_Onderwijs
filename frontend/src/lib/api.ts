// Alle communicatie met de backend. Er gaan hier nooit namen van leerlingen doorheen:
// alleen leerlingcodes en (geanonimiseerde) tekst of afbeeldingen.

import type { Criterium, CriteriumVoorstel } from '../types'

export interface ModelInfo {
  id: string
  naam: string
  omschrijving: string
  kanLezen: boolean
  kanBeoordelen: boolean
  beschikbaar: boolean
  reden: string | null
}

export interface BestandResultaat {
  bestandsnaam: string
  paginas: { nummer: number; soort: 'tekst' | 'afbeelding'; tekst?: string | null; afbeelding?: string | null }[]
  waarschuwingen: string[]
}

export class ApiFout extends Error {}

async function verzoek<T>(pad: string, init?: RequestInit): Promise<T> {
  let antwoord: Response
  try {
    antwoord = await fetch(`/api${pad}`, init)
  } catch {
    throw new ApiFout('De backend is niet bereikbaar. Start de backend (zie README) en probeer het opnieuw.')
  }
  if (!antwoord.ok) {
    const data = await antwoord.json().catch(() => null)
    const detail = typeof data?.detail === 'string' ? data.detail : null
    if (antwoord.status === 413) throw new ApiFout('Dit bestand is te groot.')
    if (antwoord.status >= 500 && !detail) throw new ApiFout('De backend is niet bereikbaar of gaf een fout. Draait hij?')
    throw new ApiFout(detail ?? `Er ging iets mis (code ${antwoord.status}).`)
  }
  return antwoord.json()
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  status: () => verzoek<{ ok: boolean; versie: string }>('/status'),
  modellen: () => verzoek<ModelInfo[]>('/modellen'),

  bestand(bestand: File) {
    const data = new FormData()
    data.append('bestand', bestand)
    return verzoek<BestandResultaat>('/bestanden', { method: 'POST', body: data })
  },

  transcribeer: (body: { model: string; vak: string; afbeeldingen: string[] }) =>
    verzoek<{ model: string; leesbaar: boolean; tekst: string; opmerking: string | null }>('/transcribeer', json(body)),

  rubric: (body: { model: string; vak: string; tekst: string }) =>
    verzoek<{ model: string; criteria: Criterium[]; waarschuwingen: string[] }>('/rubric', json(body)),

  beoordeel: (body: { model: string; leerlingcode: string; vak: string; opdracht: string; criteria: Criterium[]; tekst: string }) =>
    verzoek<{ model: string; criteria: CriteriumVoorstel[]; feedback: string; waarschuwingen: string[] }>('/beoordeel', json(body)),
}

export const blobNaarBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lezer = new FileReader()
    lezer.onload = () => resolve(String(lezer.result).split(',')[1])
    lezer.onerror = () => reject(lezer.error)
    lezer.readAsDataURL(blob)
  })

export async function base64NaarBlob(base64: string, type = 'image/jpeg'): Promise<Blob> {
  const res = await fetch(`data:${type};base64,${base64}`)
  return res.blob()
}
