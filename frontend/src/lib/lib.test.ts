import { describe, expect, it } from 'vitest'
import type { Criterium, Inlevering } from '../types'
import { berekenCijfer } from './cijfer'
import { codeUitBestandsnaam, volgendeCode } from './id'
import { anonimiseer, meetCER, verwerkMarkeringen, vindCitaat, vindOnzeker } from './tekst'

const criteria: Criterium[] = [
  { id: 'a', naam: 'A', omschrijving: '', niveaus: [{ id: 'a1', label: 'x', omschrijving: '', punten: 2 }, { id: 'a2', label: 'y', omschrijving: '', punten: 10 }] },
  { id: 'b', naam: 'B', omschrijving: '', niveaus: [{ id: 'b1', label: 'x', omschrijving: '', punten: 5 }, { id: 'b2', label: 'y', omschrijving: '', punten: 20 }] },
]
const inlevering = (oordelen: Inlevering['oordelen']): Inlevering => ({
  id: 'i', toetsId: 't', leerlingcode: 'L1', paginas: [], oordelen, feedback: '', aangemaaktOp: '',
})

describe('cijfer', () => {
  it('standaardformule 1 + 9 × behaald/max', () => {
    const b = berekenCijfer(criteria, inlevering({ a: { niveauId: 'a2', besluit: 'geaccepteerd' }, b: { niveauId: 'b1', besluit: 'aangepast' } }), { minimum: 1, maximum: 10, decimalen: 1 })
    expect(b.behaald).toBe(15)
    expect(b.max).toBe(30)
    expect(b.cijfer).toBe(5.5)
    expect(b.open).toBe(0)
  })
  it('telt criteria zonder besluit (of afgewezen) als open', () => {
    const b = berekenCijfer(criteria, inlevering({ a: { niveauId: null, besluit: 'afgewezen' } }), { minimum: 1, maximum: 10, decimalen: 1 })
    expect(b.open).toBe(2)
  })
  it('rubric zonder punten geeft geen cijfer', () => {
    const leeg: Criterium[] = [{ id: 'a', naam: 'A', omschrijving: '', niveaus: [{ id: 'a1', label: 'x', omschrijving: '', punten: 0 }] }]
    expect(berekenCijfer(leeg, inlevering({}), { minimum: 1, maximum: 10, decimalen: 1 }).cijfer).toBeNull()
  })
})

describe('transcriptie', () => {
  it('haalt [[ ]]-markeringen eruit en onthoudt posities', () => {
    const { tekst, onzeker } = verwerkMarkeringen('Ik vind [[huiswerk]] leuk en [[?]] niet.')
    expect(tekst).toBe('Ik vind huiswerk leuk en … niet.')
    expect(tekst.slice(onzeker[0].start, onzeker[0].eind)).toBe('huiswerk')
  })
  it('vindt een onzeker woord terug na een wijziging ervoor, en niet meer na verbetering', () => {
    const o = { start: 8, eind: 16, woord: 'huiswenk' }
    expect(vindOnzeker('Ik vind huiswenk leuk', o)).toEqual({ start: 8, eind: 16 })
    expect(vindOnzeker('Echt, ik vind huiswenk leuk', o)).toEqual({ start: 14, eind: 22 })
    expect(vindOnzeker('Ik vind huiswerk leuk', o)).toBeNull()
  })
  it('CER: 1 fout op 20 tekens = 5%', () => {
    const m = meetCER('Ik vind huiswenk leuk', 'Ik vind huiswerk leuk')
    expect(m.fouten).toBe(1)
    expect(m.cer).toBeCloseTo(1 / 21)
  })
  it('CER negeert extra witruimte', () => {
    expect(meetCER('Ik  vind\nhuiswerk', 'Ik vind huiswerk').fouten).toBe(0)
  })
})

describe('citaten', () => {
  const tekst = 'Zelf merk ik bij vrienden hoe makkelijk je erin “gezogen” wordt.\nDat is lastig.'
  it('vindt citaten ondanks andere aanhalingstekens, hoofdletters en witruimte', () => {
    expect(vindCitaat(tekst, 'hoe makkelijk je erin "gezogen" wordt')).not.toBeNull()
    expect(vindCitaat(tekst, 'wordt. dat is lastig')).not.toBeNull()
  })
  it('verzonnen citaat wordt niet gevonden', () => {
    expect(vindCitaat(tekst, 'sociale media zijn slecht')).toBeNull()
  })
  it('citaat met [NAAM] vindt de passage met de echte naam', () => {
    expect(vindCitaat('Mijn vriendin Fenna de Groot zegt dat ook.', 'vriendin [NAAM] zegt')).not.toBeNull()
  })
})

describe('privacy', () => {
  it('vervangt namen uit de koppeltabel, ook alleen de voornaam', () => {
    const r = anonimiseer('Ik ben Fenna de Groot. Fenna schrijft graag. Fennaatje niet.', [{ code: 'L1', naam: 'Fenna de Groot', klas: '' }])
    expect(r.tekst).toBe('Ik ben [NAAM]. [NAAM] schrijft graag. Fennaatje niet.')
    expect(r.vervangen).toBe(2)
  })
})

describe('codes', () => {
  it('volgende vrije code en code uit bestandsnaam', () => {
    expect(volgendeCode(['L001', 'L002'])).toBe('L003')
    expect(codeUitBestandsnaam('L023_essay.jpg')).toBe('L023')
    expect(codeUitBestandsnaam('123456.pdf')).toBe('123456')
    // Camerabestandsnamen (datum) zijn geen leerlingcode
    expect(codeUitBestandsnaam('IMG_20261102.heic')).toBeNull()
    expect(codeUitBestandsnaam('IMG_1234.JPG')).toBeNull()
    expect(codeUitBestandsnaam('essay.docx')).toBeNull()
  })
})
