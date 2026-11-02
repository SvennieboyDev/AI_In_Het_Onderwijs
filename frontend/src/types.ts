// Het gegevensmodel van de NakijkAssistent.
// Alles wordt lokaal opgeslagen in de browser van de docent (IndexedDB).
// Namen van leerlingen staan ALLEEN in de koppeltabel (Leerling) en gaan nooit naar de backend.

export interface Niveau {
  id: string
  label: string
  omschrijving: string
  punten: number
}

export interface Criterium {
  id: string
  naam: string
  omschrijving: string
  niveaus: Niveau[]
}

export interface Toets {
  id: string
  titel: string
  vak: string
  klas: string
  soort: string // id van het sjabloon, bv. 'betoog'
  opdracht: string
  criteria: Criterium[]
  aangemaaktOp: string
}

export interface Pagina {
  id: string
  bestandsnaam: string
  nummer: number
  soort: 'tekst' | 'afbeelding'
  tekst?: string
  afbeeldingId?: string // verwijst naar een Blob in IndexedDB
}

export interface OnzekerWoord {
  start: number
  eind: number
  woord: string
}

export interface Transcriptie {
  model: string
  origineel: string // tekst zoals het leesmodel hem gaf, zonder [[ ]]-markeringen
  onzeker: OnzekerWoord[] // posities in `origineel`
  tekst: string // tekst zoals de docent hem heeft gecontroleerd
  opmerking?: string | null
  bevestigd: boolean
  meting?: { fouten: number; tekens: number; cer: number }
}

export type Zekerheid = 'hoog' | 'middel' | 'laag'

export interface CriteriumVoorstel {
  criteriumId: string
  status: 'voorstel' | 'docent-moet-beoordelen'
  niveauId: string | null
  punten: number | null
  citaten: string[]
  argumentatie: string
  zekerheid: Zekerheid
  reden?: string | null
}

export interface Beoordeling {
  model: string
  tijdstip: string
  voorstellen: CriteriumVoorstel[]
  feedback: string
  waarschuwingen: string[]
}

export type Besluit = 'geaccepteerd' | 'aangepast' | 'afgewezen'

// Het besluit van de docent per criterium. Alleen dit telt voor het cijfer.
export interface Oordeel {
  niveauId: string | null
  besluit: Besluit | null
  notitie?: string
}

export interface Inlevering {
  id: string
  toetsId: string
  leerlingcode: string
  paginas: Pagina[]
  transcriptie?: Transcriptie
  beoordeling?: Beoordeling
  oordelen: Record<string, Oordeel>
  feedback: string
  cijfer?: number // alleen gezet als de docent het cijfer heeft vastgesteld
  vastgesteldOp?: string
  aangemaaktOp: string
}

export interface Leerling {
  code: string
  naam: string
  klas: string
}

export interface CijferInstellingen {
  minimum: number
  maximum: number
  decimalen: number
}

export interface Instellingen {
  thema: 'systeem' | 'licht' | 'donker'
  tekstgrootte: number // procent: 100, 112.5, 125, 137.5
  cijfer: CijferInstellingen
  leesmodel: string
  beoordelingsmodel: string
  namenTonen: boolean
}

export interface Staat {
  versie: 1
  toetsen: Toets[]
  inleveringen: Inlevering[]
  leerlingen: Leerling[]
  instellingen: Instellingen
}
