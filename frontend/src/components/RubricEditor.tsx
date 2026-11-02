import { Plus, Trash2 } from 'lucide-react'
import { getal, maxPunten, totaalMax } from '../lib/cijfer'
import { maakId } from '../lib/id'
import { leegCriterium } from '../lib/sjablonen'
import type { Criterium, Niveau } from '../types'

export function valideerRubric(criteria: Criterium[]): string[] {
  const fouten: string[] = []
  if (criteria.length === 0) fouten.push('Voeg minstens één criterium toe.')
  criteria.forEach((c, i) => {
    const naam = c.naam.trim() || `Criterium ${i + 1}`
    if (!c.naam.trim()) fouten.push(`Criterium ${i + 1} heeft geen naam.`)
    if (c.niveaus.length < 2) fouten.push(`${naam}: geef minstens twee niveaus.`)
    if (maxPunten(c) <= 0) fouten.push(`${naam}: er staan geen punten bij de niveaus.`)
    if (c.niveaus.some((n) => !n.label.trim())) fouten.push(`${naam}: elk niveau heeft een naam nodig.`)
    if (c.niveaus.some((n) => n.punten < 0 || Number.isNaN(n.punten))) fouten.push(`${naam}: punten kunnen niet negatief zijn.`)
  })
  return fouten
}

export default function RubricEditor({ criteria, onChange }: { criteria: Criterium[]; onChange: (c: Criterium[]) => void }) {
  const wijzig = (id: string, w: Partial<Criterium>) => onChange(criteria.map((c) => (c.id === id ? { ...c, ...w } : c)))
  const wijzigNiveau = (c: Criterium, nid: string, w: Partial<Niveau>) =>
    wijzig(c.id, { niveaus: c.niveaus.map((n) => (n.id === nid ? { ...n, ...w } : n)) })

  return (
    <div>
      {criteria.map((c, ci) => (
        <fieldset key={c.id} className="criterium-bewerk" style={{ border: 0, margin: 0, borderTop: '1px solid var(--lijn)' }}>
          <legend className="sr-only">Criterium {ci + 1}</legend>
          <div className="rij" style={{ alignItems: 'flex-end' }}>
            <label className="veld" style={{ flex: 1, minWidth: '14rem' }}>
              <span>Criterium {ci + 1}</span>
              <input value={c.naam} placeholder="Bijvoorbeeld: Argumentatie" onChange={(e) => wijzig(c.id, { naam: e.target.value })} />
            </label>
            <span className="zacht klein cijfers" style={{ paddingBottom: '0.6rem' }}>
              max. {getal(maxPunten(c))} punten
            </span>
            <button
              type="button"
              className="knop-icoon"
              aria-label={`Verwijder criterium ${c.naam || ci + 1}`}
              onClick={() => onChange(criteria.filter((x) => x.id !== c.id))}
            >
              <Trash2 size={18} />
            </button>
          </div>
          <label className="veld">
            <span className="sr-only">Omschrijving</span>
            <input value={c.omschrijving} placeholder="Waar let je op? (optioneel)" onChange={(e) => wijzig(c.id, { omschrijving: e.target.value })} />
          </label>
          <div className="stapel" style={{ gap: '0.5rem' }}>
            <div className="niveau-bewerk zacht klein" aria-hidden>
              <span>Niveau</span>
              <span className="niveau-omschr">Omschrijving</span>
              <span>Punten</span>
              <span />
            </div>
            {c.niveaus.map((n, ni) => (
              <div key={n.id} className="niveau-bewerk">
                <input aria-label={`Naam niveau ${ni + 1}`} value={n.label} onChange={(e) => wijzigNiveau(c, n.id, { label: e.target.value })} />
                <input
                  className="niveau-omschr"
                  aria-label={`Omschrijving niveau ${n.label}`}
                  value={n.omschrijving}
                  onChange={(e) => wijzigNiveau(c, n.id, { omschrijving: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  aria-label={`Punten niveau ${n.label}`}
                  value={Number.isNaN(n.punten) ? '' : n.punten}
                  onChange={(e) => wijzigNiveau(c, n.id, { punten: e.target.value === '' ? NaN : Number(e.target.value) })}
                />
                <button
                  type="button"
                  className="knop-icoon"
                  aria-label={`Verwijder niveau ${n.label}`}
                  onClick={() => wijzig(c.id, { niveaus: c.niveaus.filter((x) => x.id !== n.id) })}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div>
              <button
                type="button"
                className="knop knop-stil knop-klein"
                onClick={() => wijzig(c.id, { niveaus: [...c.niveaus, { id: maakId('n'), label: '', omschrijving: '', punten: maxPunten(c) }] })}
              >
                <Plus size={16} aria-hidden /> Niveau toevoegen
              </button>
            </div>
          </div>
        </fieldset>
      ))}
      <div className="rij" style={{ borderTop: '1px solid var(--lijn)', paddingTop: '1rem', justifyContent: 'space-between' }}>
        <button type="button" className="knop" onClick={() => onChange([...criteria, leegCriterium()])}>
          <Plus size={18} aria-hidden /> Criterium toevoegen
        </button>
        <strong className="cijfers">Totaal: {getal(totaalMax(criteria))} punten</strong>
      </div>
    </div>
  )
}
