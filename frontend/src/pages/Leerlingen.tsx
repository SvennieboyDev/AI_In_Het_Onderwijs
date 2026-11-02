// Koppeltabel leerlingcode ↔ naam. Deze lijst blijft op deze computer en gaat nooit naar de AI.

import { Lock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Melding, useToast } from '../components/ui'
import { volgendeCode } from '../lib/id'
import { useStore } from '../lib/store'

export default function Leerlingen() {
  const { leerlingen, zetLeerlingen, instellingen, wijzigInstellingen } = useStore()
  const toast = useToast()
  const [plak, setPlak] = useState('')
  const [klas, setKlas] = useState('')

  const wijzig = (index: number, veld: 'code' | 'naam' | 'klas', waarde: string) =>
    zetLeerlingen(leerlingen.map((l, i) => (i === index ? { ...l, [veld]: waarde } : l)))

  function importeer() {
    const nieuw = [...leerlingen]
    for (const regel of plak.split('\n').map((r) => r.trim()).filter(Boolean)) {
      // "123456;Fenna de Groot", "123456<tab>Fenna de Groot" of alleen "Fenna de Groot"
      const [a, b] = regel.split(/[;\t,]/).map((d) => d.trim())
      const code = b ? a : volgendeCode(nieuw.map((l) => l.code))
      const naam = b ?? a
      const bestaand = nieuw.findIndex((l) => l.code === code)
      if (bestaand >= 0) nieuw[bestaand] = { ...nieuw[bestaand], naam }
      else nieuw.push({ code, naam, klas })
    }
    zetLeerlingen(nieuw)
    toast(`${nieuw.length - leerlingen.length} leerling(en) toegevoegd`)
    setPlak('')
  }

  const gesorteerd = leerlingen.map((l, i) => ({ l, i })).sort((a, b) => a.l.klas.localeCompare(b.l.klas) || a.l.code.localeCompare(b.l.code, 'nl', { numeric: true }))

  return (
    <div className="pagina">
      <div className="pagina-kop">
        <div>
          <h1>Leerlingen</h1>
          <p className="zacht">Koppel leerlingcodes aan namen, zodat jij ziet wie wie is.</p>
        </div>
      </div>

      <Melding>
        <strong>
          <Lock size={14} aria-hidden /> Blijft op deze computer.
        </strong>{' '}
        Deze lijst wordt alleen in deze browser bewaard. Het AI-model krijgt alleen de codes te zien; namen die toch in een tekst staan,
        worden vóór verzending vervangen door [NAAM].
      </Melding>

      <section className="sectie">
        <div className="rij" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2>Koppeltabel</h2>
          <label className="rij klein">
            <input type="checkbox" checked={instellingen.namenTonen} onChange={(e) => wijzigInstellingen({ namenTonen: e.target.checked })} />
            Namen tonen tijdens het nakijken
          </label>
        </div>
        {leerlingen.length === 0 ? (
          <p className="zacht">Nog geen leerlingen. Plak hieronder een lijst uit je leerlingvolgsysteem.</p>
        ) : (
          <table className="tabel">
            <thead>
              <tr>
                <th style={{ width: '10rem' }}>Code</th>
                <th>Naam</th>
                <th style={{ width: '8rem' }}>Klas</th>
                <th style={{ width: '3rem' }}>
                  <span className="sr-only">Verwijderen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {gesorteerd.map(({ l, i }) => (
                <tr key={i}>
                  <td>
                    <input aria-label="Code" value={l.code} onChange={(e) => wijzig(i, 'code', e.target.value)} />
                  </td>
                  <td>
                    <input aria-label="Naam" value={l.naam} onChange={(e) => wijzig(i, 'naam', e.target.value)} />
                  </td>
                  <td>
                    <input aria-label="Klas" value={l.klas} onChange={(e) => wijzig(i, 'klas', e.target.value)} />
                  </td>
                  <td>
                    <button className="knop-icoon" aria-label={`${l.naam || l.code} verwijderen`} onClick={() => zetLeerlingen(leerlingen.filter((_, x) => x !== i))}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button
          className="knop knop-stil"
          style={{ marginTop: '0.75rem' }}
          onClick={() => zetLeerlingen([...leerlingen, { code: volgendeCode(leerlingen.map((l) => l.code)), naam: '', klas }])}
        >
          <Plus size={18} aria-hidden /> Leerling toevoegen
        </button>
      </section>

      <section className="sectie stapel">
        <h2>Lijst plakken</h2>
        <div className="raster-2">
          <label className="veld">
            <span>Eén leerling per regel</span>
            <textarea rows={6} value={plak} onChange={(e) => setPlak(e.target.value)} placeholder={'123456;Fenna de Groot\n123457;Daan van Rijn'} />
            <small>Formaat: leerlingnummer;naam. Alleen een naam mag ook; dan maakt de tool een code.</small>
          </label>
          <label className="veld" style={{ alignContent: 'start' }}>
            <span>Klas (optioneel)</span>
            <input value={klas} onChange={(e) => setKlas(e.target.value)} placeholder="4H2" />
          </label>
        </div>
        <div>
          <button className="knop knop-primair" disabled={!plak.trim()} onClick={importeer}>
            Toevoegen
          </button>
        </div>
      </section>
    </div>
  )
}
