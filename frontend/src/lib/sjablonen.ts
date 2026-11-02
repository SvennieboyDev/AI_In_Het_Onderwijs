// Voorinstellingen voor Nederlands. Het vak is een instelling: voor andere vakken
// kunnen hier later sjablonen bij, zonder de rest van de tool te veranderen.

import type { Criterium } from '../types'
import { maakId } from './id'

type NiveauSjabloon = [label: string, omschrijving: string, punten: number]
type CriteriumSjabloon = { naam: string; omschrijving: string; niveaus: NiveauSjabloon[] }

export interface Sjabloon {
  id: string
  naam: string
  vak: string
  uitleg: string
  criteria: CriteriumSjabloon[]
}

const taalverzorging = (max: number): CriteriumSjabloon => ({
  naam: 'Taalverzorging',
  omschrijving: 'Spelling, grammatica (zinsbouw, werkwoordsvormen) en interpunctie.',
  niveaus: [
    ['Onvoldoende', 'Veel fouten die het lezen hinderen.', Math.round(max * 0.25)],
    ['Voldoende', 'Regelmatig fouten, maar de tekst blijft goed leesbaar.', Math.round(max * 0.55)],
    ['Goed', 'Enkele fouten, vooral in lastige gevallen.', Math.round(max * 0.8)],
    ['Uitstekend', 'Vrijwel foutloos.', max],
  ],
})

const opbouw = (max: number): CriteriumSjabloon => ({
  naam: 'Opbouw',
  omschrijving: "Inleiding, kern en slot; alinea's met één hoofdgedachte; signaalwoorden.",
  niveaus: [
    ['Onvoldoende', 'Geen herkenbare indeling; alinea’s ontbreken of lopen door elkaar.', Math.round(max * 0.25)],
    ['Voldoende', 'Inleiding, kern en slot zijn herkenbaar; verbanden zijn niet altijd duidelijk.', Math.round(max * 0.55)],
    ['Goed', 'Logische volgorde met duidelijke alinea’s en passende signaalwoorden.', Math.round(max * 0.8)],
    ['Uitstekend', 'Sterke, doordachte opbouw; slot rondt het geheel overtuigend af.', max],
  ],
})

export const SJABLONEN: Sjabloon[] = [
  {
    id: 'betoog',
    naam: 'Betoog',
    vak: 'Nederlands',
    uitleg: 'De leerling neemt een standpunt in en onderbouwt dat met argumenten.',
    criteria: [
      {
        naam: 'Standpunt en inhoud',
        omschrijving: 'Helder standpunt in de inleiding; relevante, inhoudelijk juiste argumenten.',
        niveaus: [
          ['Onvoldoende', 'Geen duidelijk standpunt of argumenten zijn niet relevant.', 2],
          ['Voldoende', 'Standpunt is te herleiden; argumenten zijn algemeen.', 5],
          ['Goed', 'Duidelijk standpunt met relevante, concrete argumenten.', 8],
          ['Uitstekend', 'Scherp standpunt; sterke, goed gekozen argumenten met eigen inbreng.', 10],
        ],
      },
      {
        naam: 'Argumentatie',
        omschrijving: 'Onderbouwing met voorbeelden of bronnen; tegenargument genoemd en weerlegd.',
        niveaus: [
          ['Onvoldoende', 'Argumenten worden niet onderbouwd.', 2],
          ['Voldoende', 'Onderbouwing is aanwezig maar vaag; tegenargument ontbreekt of wordt niet weerlegd.', 5],
          ['Goed', 'Argumenten onderbouwd met voorbeelden; tegenargument wordt weerlegd.', 8],
          ['Uitstekend', 'Overtuigende onderbouwing met bronnen; weerlegging is sterk.', 10],
        ],
      },
      opbouw(8),
      taalverzorging(6),
    ],
  },
  {
    id: 'verslag',
    naam: 'Verslag',
    vak: 'Nederlands',
    uitleg: 'De leerling doet zakelijk en volledig verslag van een onderzoek, boek of activiteit.',
    criteria: [
      {
        naam: 'Inhoud en volledigheid',
        omschrijving: 'Alle gevraagde onderdelen zijn aanwezig en inhoudelijk juist.',
        niveaus: [
          ['Onvoldoende', 'Belangrijke onderdelen ontbreken.', 3],
          ['Voldoende', 'De meeste onderdelen zijn aanwezig, soms oppervlakkig.', 6],
          ['Goed', 'Volledig en inhoudelijk juist.', 9],
          ['Uitstekend', 'Volledig, juist en met eigen verdieping.', 12],
        ],
      },
      {
        naam: 'Bronnengebruik',
        omschrijving: 'Informatie uit bronnen is correct verwerkt en vermeld.',
        niveaus: [
          ['Onvoldoende', 'Geen bronnen of letterlijk overgenomen zonder vermelding.', 1],
          ['Voldoende', 'Bronnen genoemd, verwerking is beperkt.', 3],
          ['Goed', 'Bronnen goed verwerkt en vermeld.', 5],
          ['Uitstekend', 'Bronnen kritisch gekozen, verwerkt en correct vermeld.', 6],
        ],
      },
      opbouw(6),
      taalverzorging(6),
    ],
  },
  {
    id: 'beschouwing',
    naam: 'Beschouwing',
    vak: 'Nederlands',
    uitleg: 'De leerling belicht een onderwerp van meerdere kanten en komt tot een afgewogen conclusie.',
    criteria: [
      {
        naam: 'Inhoud en perspectieven',
        omschrijving: 'Het onderwerp wordt van meerdere kanten belicht met relevante informatie.',
        niveaus: [
          ['Onvoldoende', 'Slechts één kant of weinig relevante informatie.', 2],
          ['Voldoende', 'Meerdere kanten genoemd, maar oppervlakkig.', 5],
          ['Goed', 'Meerdere kanten uitgewerkt met relevante voorbeelden.', 8],
          ['Uitstekend', 'Genuanceerd en diepgaand; perspectieven worden met elkaar verbonden.', 10],
        ],
      },
      {
        naam: 'Conclusie',
        omschrijving: 'Afgewogen conclusie die volgt uit de beschouwing.',
        niveaus: [
          ['Onvoldoende', 'Conclusie ontbreekt of volgt niet uit de tekst.', 1],
          ['Voldoende', 'Conclusie is aanwezig maar herhaalt vooral.', 3],
          ['Goed', 'Afgewogen conclusie die logisch volgt.', 5],
          ['Uitstekend', 'Overtuigende, eigen conclusie die het geheel verbindt.', 6],
        ],
      },
      opbouw(8),
      taalverzorging(6),
    ],
  },
  { id: 'leeg', naam: 'Eigen rubric', vak: 'Nederlands', uitleg: 'Begin met een lege rubric of plak je eigen rubric.', criteria: [] },
]

export const VAKKEN = ['Nederlands', 'Engels', 'Geschiedenis', 'Aardrijkskunde', 'Maatschappijleer', 'Anders']

export function criteriaUitSjabloon(id: string): Criterium[] {
  const sjabloon = SJABLONEN.find((s) => s.id === id)
  return (sjabloon?.criteria ?? []).map((c) => ({
    id: maakId('c'),
    naam: c.naam,
    omschrijving: c.omschrijving,
    niveaus: c.niveaus.map(([label, omschrijving, punten]) => ({ id: maakId('n'), label, omschrijving, punten })),
  }))
}

export function leegCriterium(): Criterium {
  return {
    id: maakId('c'),
    naam: '',
    omschrijving: '',
    niveaus: [
      ['Onvoldoende', 1],
      ['Voldoende', 3],
      ['Goed', 5],
    ].map(([label, punten]) => ({ id: maakId('n'), label: label as string, omschrijving: '', punten: punten as number })),
  }
}
