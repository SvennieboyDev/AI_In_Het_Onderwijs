// De nakijkstroom: status bepalen, transcriptie laten maken, beoordeling laten maken.
// Stap 1 (lezen) en stap 2 (beoordelen) zijn bewust gescheiden: de docent controleert
// de transcriptie voordat er beoordeeld wordt.

import type { Inlevering, Instellingen, Leerling, Oordeel, Toets, Transcriptie } from '../types'
import { api, blobNaarBase64 } from './api'
import { laadAfbeelding } from './db'
import { anonimiseer, verwerkMarkeringen } from './tekst'

export const heeftScans = (i: Inlevering) => i.paginas.some((p) => p.soort === 'afbeelding')

/** De tekst die beoordeeld wordt: de gecontroleerde transcriptie, of de getypte tekst. */
export function werkTekst(i: Inlevering): string {
  if (i.transcriptie) return i.transcriptie.tekst
  return i.paginas
    .filter((p) => p.soort === 'tekst')
    .map((p) => p.tekst ?? '')
    .join('\n\n')
}

export type StatusCode = 'transcriptie' | 'beoordelen' | 'docent' | 'controle' | 'vaststellen' | 'vastgesteld'

export interface Status {
  code: StatusCode
  label: string
  toon: 'neutraal' | 'info' | 'let-op' | 'goed'
}

export function bepaalStatus(i: Inlevering, toets: Toets): Status {
  if (i.cijfer !== undefined) return { code: 'vastgesteld', label: 'Vastgesteld', toon: 'goed' }
  if (heeftScans(i) && !i.transcriptie?.bevestigd) return { code: 'transcriptie', label: 'Transcriptie controleren', toon: 'info' }
  if (!i.beoordeling) return { code: 'beoordelen', label: 'Klaar voor AI-voorstel', toon: 'neutraal' }
  const open = toets.criteria.filter((c) => !i.oordelen[c.id]?.besluit || !i.oordelen[c.id]?.niveauId)
  const docent = i.beoordeling.voorstellen.some((v) => v.status === 'docent-moet-beoordelen' && !i.oordelen[v.criteriumId]?.niveauId)
  if (docent) return { code: 'docent', label: 'Docent moet beoordelen', toon: 'let-op' }
  if (open.length) return { code: 'controle', label: 'Voorstel controleren', toon: 'info' }
  return { code: 'vaststellen', label: 'Klaar om vast te stellen', toon: 'neutraal' }
}

export async function maakTranscriptie(i: Inlevering, instellingen: Instellingen, vak: string): Promise<Transcriptie> {
  const scans = i.paginas.filter((p) => p.soort === 'afbeelding' && p.afbeeldingId)
  const afbeeldingen = await Promise.all(
    scans.map(async (p) => {
      const blob = await laadAfbeelding(p.afbeeldingId!)
      if (!blob) throw new Error(`De afbeelding van pagina ${p.nummer} ontbreekt.`)
      return blobNaarBase64(blob)
    }),
  )
  const antwoord = await api.transcribeer({ model: instellingen.leesmodel, vak, afbeeldingen })
  const { tekst, onzeker } = verwerkMarkeringen(antwoord.tekst)
  // Getypte pagina's in dezelfde inlevering gaan er gewoon bij
  const getypt = i.paginas.filter((p) => p.soort === 'tekst').map((p) => p.tekst ?? '').join('\n\n')
  const verschuiving = getypt ? getypt.length + 2 : 0
  const volledig = getypt ? `${getypt}\n\n${tekst}` : tekst
  return {
    model: antwoord.model,
    origineel: volledig,
    onzeker: onzeker.map((o) => ({ ...o, start: o.start + verschuiving, eind: o.eind + verschuiving })),
    tekst: volledig,
    opmerking: antwoord.opmerking,
    bevestigd: false,
  }
}

export async function maakBeoordeling(
  i: Inlevering,
  toets: Toets,
  leerlingen: Leerling[],
  instellingen: Instellingen,
): Promise<Partial<Inlevering>> {
  // Privacy: namen uit de lokale koppeltabel eruit vóór verzending
  const { tekst } = anonimiseer(werkTekst(i), leerlingen)
  const antwoord = await api.beoordeel({
    model: instellingen.beoordelingsmodel,
    leerlingcode: i.leerlingcode,
    vak: toets.vak,
    opdracht: toets.opdracht,
    criteria: toets.criteria,
    tekst,
  })
  const oordelen: Record<string, Oordeel> = {}
  for (const v of antwoord.criteria) oordelen[v.criteriumId] = { niveauId: v.niveauId, besluit: null }
  return {
    beoordeling: {
      model: antwoord.model,
      tijdstip: new Date().toISOString(),
      voorstellen: antwoord.criteria,
      feedback: antwoord.feedback,
      waarschuwingen: antwoord.waarschuwingen,
    },
    oordelen,
    feedback: antwoord.feedback,
    cijfer: undefined,
    vastgesteldOp: undefined,
  }
}
