// Cijferberekening. De formule is instelbaar; standaard 1 + 9 × (behaald / max).

import type { CijferInstellingen, Criterium, Inlevering } from '../types'

export const maxPunten = (c: Criterium) => Math.max(0, ...c.niveaus.map((n) => n.punten))
export const totaalMax = (criteria: Criterium[]) => criteria.reduce((som, c) => som + maxPunten(c), 0)

export function puntenVanOordeel(c: Criterium, niveauId: string | null | undefined): number | null {
  return c.niveaus.find((n) => n.id === niveauId)?.punten ?? null
}

export interface Berekening {
  behaald: number
  max: number
  open: number // criteria zonder besluit van de docent
  cijfer: number | null
  formule: string
}

export function berekenCijfer(criteria: Criterium[], inlevering: Inlevering, instelling: CijferInstellingen): Berekening {
  const max = totaalMax(criteria)
  let behaald = 0
  let open = 0
  for (const c of criteria) {
    const oordeel = inlevering.oordelen[c.id]
    const punten = oordeel?.besluit ? puntenVanOordeel(c, oordeel.niveauId) : null
    if (punten === null) open++
    else behaald += punten
  }
  const { minimum, maximum, decimalen } = instelling
  const cijfer = max > 0 ? rond(minimum + (maximum - minimum) * (behaald / max), decimalen) : null
  const formule = `${getal(minimum)} + ${getal(maximum - minimum)} × ${getal(behaald)} / ${getal(max)}`
  return { behaald, max, open, cijfer, formule }
}

export function rond(waarde: number, decimalen: number) {
  const f = 10 ** decimalen
  return Math.round(waarde * f) / f
}

export const getal = (n: number, decimalen?: number) =>
  n.toLocaleString('nl-NL', decimalen === undefined ? { maximumFractionDigits: 2 } : { minimumFractionDigits: decimalen, maximumFractionDigits: decimalen })
