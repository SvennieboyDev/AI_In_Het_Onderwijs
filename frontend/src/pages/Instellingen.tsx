import { useEffect, useState } from 'react'
import { Melding, useToast } from '../components/ui'
import { api, type ModelInfo } from '../lib/api'
import { getal, rond } from '../lib/cijfer'
import { STANDAARD_INSTELLINGEN, useStore } from '../lib/store'

const TEKSTGROOTTES: [number, string][] = [
  [100, 'Normaal'],
  [112.5, 'Groot'],
  [125, 'Groter'],
  [137.5, 'Grootst'],
]
const NORM_CER = 0.05 // PvE-eis 3: maximaal 5% verkeerd herkende tekens

export default function Instellingen() {
  const { instellingen, wijzigInstellingen, toetsen, inleveringen, wisAlleGegevens } = useStore()
  const toast = useToast()
  const [modellen, setModellen] = useState<ModelInfo[] | null>(null)
  const [modelFout, setModelFout] = useState<string>()

  useEffect(() => {
    api
      .modellen()
      .then(setModellen)
      .catch((e: Error) => setModelFout(e.message))
  }, [])

  const c = instellingen.cijfer
  const zetCijfer = (w: Partial<typeof c>) => wijzigInstellingen({ cijfer: { ...c, ...w } })

  // Handschriftmeting: alle bevestigde transcripties met een meting
  const metingen = inleveringen
    .filter((i) => i.transcriptie?.meting)
    .map((i) => ({ i, m: i.transcriptie!.meting!, toets: toetsen.find((t) => t.id === i.toetsId)?.titel ?? '?' }))
  const totaalFouten = metingen.reduce((s, x) => s + x.m.fouten, 0)
  const totaalTekens = metingen.reduce((s, x) => s + x.m.tekens, 0)
  const totaalCER = totaalTekens ? totaalFouten / totaalTekens : null

  const modelKeuze = (taak: 'lezen' | 'beoordelen') => {
    const sleutel = taak === 'lezen' ? 'leesmodel' : 'beoordelingsmodel'
    const opties = modellen?.filter((m) => (taak === 'lezen' ? m.kanLezen : m.kanBeoordelen)) ?? []
    const gekozen = opties.find((m) => m.id === instellingen[sleutel])
    return (
      <label className="veld">
        <span>{taak === 'lezen' ? 'Leesmodel (handschrift overschrijven)' : 'Beoordelingsmodel (rubric en voorstel)'}</span>
        <select value={instellingen[sleutel]} onChange={(e) => wijzigInstellingen({ [sleutel]: e.target.value })} disabled={!modellen}>
          {opties.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.beschikbaar}>
              {m.naam}
              {m.beschikbaar ? '' : ' (niet ingesteld)'}
            </option>
          ))}
        </select>
        {gekozen && <small>{gekozen.omschrijving}</small>}
      </label>
    )
  }

  return (
    <div className="pagina">
      <div className="pagina-kop">
        <h1>Instellingen</h1>
      </div>

      <section className="sectie stapel">
        <h2>Weergave</h2>
        <div className="raster-2">
          <fieldset className="veld" style={{ border: 0, padding: 0, margin: 0 }}>
            <span>Thema</span>
            <div className="keuze">
              {(['systeem', 'licht', 'donker'] as const).map((t) => (
                <label key={t}>
                  <input type="radio" name="thema" checked={instellingen.thema === t} onChange={() => wijzigInstellingen({ thema: t })} />
                  {t === 'systeem' ? 'Zoals apparaat' : t === 'licht' ? 'Licht' : 'Donker'}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="veld" style={{ border: 0, padding: 0, margin: 0 }}>
            <span>Tekstgrootte</span>
            <div className="keuze">
              {TEKSTGROOTTES.map(([waarde, label]) => (
                <label key={waarde}>
                  <input type="radio" name="tekst" checked={instellingen.tekstgrootte === waarde} onChange={() => wijzigInstellingen({ tekstgrootte: waarde })} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="sectie stapel">
        <h2>Cijferberekening</h2>
        <div className="raster-3">
          <label className="veld">
            <span>Laagste cijfer</span>
            <input type="number" step={0.1} value={c.minimum} onChange={(e) => zetCijfer({ minimum: Number(e.target.value) })} />
          </label>
          <label className="veld">
            <span>Hoogste cijfer</span>
            <input type="number" step={0.1} value={c.maximum} onChange={(e) => zetCijfer({ maximum: Number(e.target.value) })} />
          </label>
          <label className="veld">
            <span>Decimalen</span>
            <select value={c.decimalen} onChange={(e) => zetCijfer({ decimalen: Number(e.target.value) })}>
              <option value={0}>Geen (7)</option>
              <option value={1}>Eén (7,4)</option>
              <option value={2}>Twee (7,42)</option>
            </select>
          </label>
        </div>
        <p className="zacht klein cijfers">
          Cijfer = {getal(c.minimum)} + {getal(c.maximum - c.minimum)} × behaald / maximum. Voorbeeld: 21 van 30 punten geeft{' '}
          {getal(rond(c.minimum + (c.maximum - c.minimum) * (21 / 30), c.decimalen), c.decimalen)}.
          {(c.minimum !== STANDAARD_INSTELLINGEN.cijfer.minimum || c.maximum !== STANDAARD_INSTELLINGEN.cijfer.maximum) && (
            <>
              {' '}
              <button className="knop knop-stil knop-klein" onClick={() => zetCijfer(STANDAARD_INSTELLINGEN.cijfer)}>
                Standaard herstellen
              </button>
            </>
          )}
        </p>
        <p className="zacht klein">Al vastgestelde cijfers veranderen niet mee.</p>
      </section>

      <section className="sectie stapel">
        <h2>AI-modellen</h2>
        {modelFout && <Melding soort="fout">{modelFout}</Melding>}
        <div className="raster-2">
          {modelKeuze('lezen')}
          {modelKeuze('beoordelen')}
        </div>
        <p className="zacht klein">
          Modellen zijn uitwisselbaar. Een API-sleutel stel je in de backend in (bestand backend/.env), nooit hier. Zie de README.
        </p>
      </section>

      <section className="sectie stapel">
        <h2>Handschriftmeting</h2>
        <p className="zacht klein">
          Bij elke bevestigde transcriptie vergelijkt de tool de tekst van het model met jouw verbeterde tekst. Dat geeft het percentage
          verkeerd herkende tekens (CER). De eis is maximaal {getal(NORM_CER * 100)}%.
        </p>
        {metingen.length === 0 ? (
          <p className="zacht">Nog geen metingen. Laat een leesmodel handschrift lezen en bevestig de transcriptie.</p>
        ) : (
          <>
            <Melding soort={totaalCER! <= NORM_CER ? 'goed' : 'let-op'}>
              Over {metingen.length} transcriptie(s): <strong className="cijfers">{getal(totaalCER! * 100, 1)}%</strong> verkeerd herkende tekens (
              {totaalFouten} van {totaalTekens}). {totaalCER! <= NORM_CER ? 'Dit voldoet aan de eis.' : 'Dit voldoet nog niet aan de eis.'}
            </Melding>
            <table className="tabel">
              <thead>
                <tr>
                  <th>Toets</th>
                  <th>Leerling</th>
                  <th>Model</th>
                  <th className="rechts">Tekens</th>
                  <th className="rechts">Fouten</th>
                  <th className="rechts">CER</th>
                </tr>
              </thead>
              <tbody>
                {metingen.map(({ i, m, toets }) => (
                  <tr key={i.id}>
                    <td>{toets}</td>
                    <td>{i.leerlingcode}</td>
                    <td>{i.transcriptie!.model}</td>
                    <td className="rechts cijfers">{m.tekens}</td>
                    <td className="rechts cijfers">{m.fouten}</td>
                    <td className="rechts cijfers">{getal(m.cer * 100, 1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="sectie stapel">
        <h2>Gegevens</h2>
        <p className="zacht klein">Alle toetsen, leerlingwerk, namen en cijfers staan alleen in deze browser op deze computer.</p>
        <div>
          <button
            className="knop knop-gevaar"
            onClick={async () => {
              if (confirm('Alle toetsen, leerlingwerk, namen en cijfers van deze computer verwijderen? Dit kan niet ongedaan worden.')) {
                await wisAlleGegevens()
                toast('Alle gegevens zijn verwijderd')
              }
            }}
          >
            Alle gegevens verwijderen
          </button>
        </div>
      </section>
    </div>
  )
}
