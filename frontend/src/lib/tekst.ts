// Tekstfuncties: onzekere woorden, CER-meting, citaten terugvinden en namen anonimiseren.

import type { Leerling, OnzekerWoord } from '../types'

/** Haalt [[woord]]-markeringen uit modeltekst en onthoudt waar de onzekere woorden stonden. */
export function verwerkMarkeringen(ruw: string): { tekst: string; onzeker: OnzekerWoord[] } {
  const onzeker: OnzekerWoord[] = []
  let tekst = ''
  let rest = 0
  for (const match of ruw.matchAll(/\[\[(.*?)\]\]/g)) {
    tekst += ruw.slice(rest, match.index)
    const woord = match[1] === '?' ? '…' : match[1]
    onzeker.push({ start: tekst.length, eind: tekst.length + woord.length, woord })
    tekst += woord
    rest = match.index! + match[0].length
  }
  tekst += ruw.slice(rest)
  return { tekst, onzeker }
}

/** Zoekt waar een onzeker woord nu staat (de docent kan ervoor tekst hebben gewijzigd). null = al aangepast. */
export function vindOnzeker(tekst: string, o: OnzekerWoord): { start: number; eind: number } | null {
  if (tekst.slice(o.start, o.eind) === o.woord) return { start: o.start, eind: o.eind }
  const venster = 300
  const van = Math.max(0, o.start - venster)
  const index = tekst.slice(van, o.eind + venster).indexOf(o.woord)
  return index === -1 ? null : { start: van + index, eind: van + index + o.woord.length }
}

/** Levenshtein-afstand op tekenniveau (aantal invoegingen, weglatingen en vervangingen). */
export function bewerkingsafstand(a: string, b: string): number {
  if (a === b) return 0
  let vorige = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const huidige = [i]
    for (let j = 1; j <= b.length; j++) {
      huidige[j] = Math.min(vorige[j] + 1, huidige[j - 1] + 1, vorige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    vorige = huidige
  }
  return vorige[b.length]
}

/**
 * Character Error Rate (PvE-eis 3): fouten van het model / lengte van de juiste tekst.
 * De door de docent gecorrigeerde tekst geldt als de juiste tekst. Witruimte wordt genormaliseerd,
 * zodat een extra regelafbreking niet als leesfout telt.
 */
export function meetCER(modelTekst: string, juisteTekst: string) {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
  const juist = norm(juisteTekst)
  const fouten = bewerkingsafstand(norm(modelTekst), juist)
  const tekens = juist.length
  return { fouten, tekens, cer: tekens ? fouten / tekens : 0 }
}

const ENKEL = /[‘’‚]/g
const DUBBEL = /[“”„]/g

/** Vindt een citaat in de tekst, ongevoelig voor hoofdletters, witruimte en soort aanhalingstekens. */
export function vindCitaat(tekst: string, citaat: string): { start: number; eind: number } | null {
  const schoon = citaat.replace(ENKEL, "'").replace(DUBBEL, '"').trim().replace(/^[.,;:!?"'…\s]+|[.,;:!?"'…\s]+$/g, '')
  if (schoon.length < 3) return null
  const delen = schoon
    .split(/\s+/)
    .map((w) =>
      w
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/'/g, "['‘’‚]")
        .replace(/"/g, '["“”„]')
        // [NAAM] in een citaat (geanonimiseerd) staat in het origineel voor een naam van 1-4 woorden
        .replace(/\\\[NAAM\\\]/g, '\\S+(?:\\s+\\S+){0,3}?'),
    )
  const match = new RegExp(delen.join('\\s+'), 'i').exec(tekst)
  return match ? { start: match.index, eind: match.index + match[0].length } : null
}

/** Vervangt namen uit de lokale koppeltabel door [NAAM] voordat tekst naar de backend gaat (AVG). */
export function anonimiseer(tekst: string, leerlingen: Leerling[]): { tekst: string; vervangen: number } {
  const namen = new Set<string>()
  for (const l of leerlingen) {
    const naam = l.naam.trim()
    if (!naam) continue
    namen.add(naam)
    const voornaam = naam.split(/\s+/)[0]
    if (voornaam.length >= 3) namen.add(voornaam)
  }
  let vervangen = 0
  // Langste namen eerst, zodat "Fenna de Groot" vóór "Fenna" wordt vervangen
  for (const naam of [...namen].sort((a, b) => b.length - a.length)) {
    const patroon = new RegExp(`(?<![\\p{L}])${naam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu')
    tekst = tekst.replace(patroon, () => {
      vervangen++
      return '[NAAM]'
    })
  }
  return { tekst, vervangen }
}

export const telWoorden = (tekst: string) => (tekst.trim() ? tekst.trim().split(/\s+/).length : 0)
