import { ArrowLeft, Wand2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RubricEditor, { valideerRubric } from '../components/RubricEditor'
import { Melding, useToast } from '../components/ui'
import { api } from '../lib/api'
import { maakId } from '../lib/id'
import { criteriaUitSjabloon, SJABLONEN, VAKKEN } from '../lib/sjablonen'
import { useStore } from '../lib/store'
import type { Toets } from '../types'

export default function ToetsBewerken() {
  const { toetsId } = useParams()
  const { toetsen, inleveringen, instellingen, voegToetsToe, wijzigToets } = useStore()
  const navigeer = useNavigate()
  const toast = useToast()
  const bestaand = toetsen.find((t) => t.id === toetsId)

  const [toets, setToets] = useState<Toets>(
    () =>
      bestaand ?? {
        id: maakId('t'),
        titel: '',
        vak: 'Nederlands',
        klas: '',
        soort: 'betoog',
        opdracht: '',
        criteria: criteriaUitSjabloon('betoog'),
        aangemaaktOp: new Date().toISOString(),
      },
  )
  const [tab, setTab] = useState<'samenstellen' | 'plakken'>('samenstellen')
  const [geplakt, setGeplakt] = useState('')
  const [omzetten, setOmzetten] = useState<{ bezig: boolean; waarschuwingen: string[]; fout?: string }>({ bezig: false, waarschuwingen: [] })
  const [fouten, setFouten] = useState<string[]>([])

  if (toetsId && !bestaand) return <div className="pagina">Deze toets bestaat niet (meer).</div>
  const beoordeeld = inleveringen.some((i) => i.toetsId === toets.id && i.beoordeling)
  const zet = (w: Partial<Toets>) => setToets((t) => ({ ...t, ...w }))

  function kiesSjabloon(id: string) {
    const heeftEigenWerk = toets.criteria.some((c) => c.naam.trim())
    if (heeftEigenWerk && !confirm('De huidige criteria worden vervangen door die van het sjabloon. Doorgaan?')) return
    zet({ soort: id, criteria: criteriaUitSjabloon(id) })
  }

  async function zetOm() {
    setOmzetten({ bezig: true, waarschuwingen: [] })
    try {
      const r = await api.rubric({ model: instellingen.beoordelingsmodel, vak: toets.vak, tekst: geplakt })
      const criteria = r.criteria.map((c) => ({ ...c, id: maakId('c'), niveaus: c.niveaus.map((n) => ({ ...n, id: maakId('n') })) }))
      zet({ criteria, soort: 'leeg' })
      setOmzetten({ bezig: false, waarschuwingen: r.waarschuwingen })
      setTab('samenstellen')
      toast(`${criteria.length} criteria herkend. Controleer ze hieronder.`)
    } catch (e) {
      setOmzetten({ bezig: false, waarschuwingen: [], fout: (e as Error).message })
    }
  }

  function bewaar(e: FormEvent) {
    e.preventDefault()
    const f = [...(toets.titel.trim() ? [] : ['Geef de toets een titel.']), ...valideerRubric(toets.criteria)]
    setFouten(f)
    if (f.length) {
      document.getElementById('fouten')?.focus()
      return
    }
    if (bestaand) wijzigToets(toets.id, toets)
    else voegToetsToe(toets)
    toast(bestaand ? 'Toets bewaard' : 'Toets aangemaakt')
    navigeer(`/toets/${toets.id}`)
  }

  return (
    <form className="pagina" onSubmit={bewaar} noValidate>
      <Link to={bestaand ? `/toets/${toets.id}` : '/'} className="terug">
        <ArrowLeft size={16} aria-hidden /> {bestaand ? toets.titel : 'Toetsen'}
      </Link>
      <div className="pagina-kop">
        <h1>{bestaand ? 'Toets bewerken' : 'Nieuwe toets'}</h1>
      </div>

      {fouten.length > 0 && (
        <div id="fouten" tabIndex={-1} style={{ marginBottom: '1.5rem' }}>
          <Melding soort="fout">
            <strong>Nog niet compleet</strong>
            <ul>
              {fouten.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Melding>
        </div>
      )}

      <section className="sectie stapel">
        <h2>Toets</h2>
        <label className={`veld ${fouten.includes('Geef de toets een titel.') ? 'veld-fout' : ''}`}>
          <span>Titel</span>
          <input value={toets.titel} onChange={(e) => zet({ titel: e.target.value })} placeholder="Bijvoorbeeld: Betoog sociale media" />
        </label>
        <div className="raster-3">
          <label className="veld">
            <span>Klas</span>
            <input value={toets.klas} onChange={(e) => zet({ klas: e.target.value })} placeholder="4H2" />
          </label>
          <label className="veld">
            <span>Vak</span>
            <select value={toets.vak} onChange={(e) => zet({ vak: e.target.value })}>
              {VAKKEN.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="veld">
            <span>Soort opdracht</span>
            <select value={toets.soort} onChange={(e) => kiesSjabloon(e.target.value)}>
              {SJABLONEN.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.naam}
                </option>
              ))}
            </select>
            <small>{SJABLONEN.find((s) => s.id === toets.soort)?.uitleg}</small>
          </label>
        </div>
        <label className="veld">
          <span>Opdracht</span>
          <textarea rows={3} value={toets.opdracht} onChange={(e) => zet({ opdracht: e.target.value })} placeholder="Plak hier de opdracht of de toetsvraag." />
          <small>De AI gebruikt de opdracht om te beoordelen of de leerling bij het onderwerp blijft.</small>
        </label>
      </section>

      <section className="sectie">
        <h2>Rubric en puntenverdeling</h2>
        {beoordeeld && (
          <div style={{ marginBottom: '1rem' }}>
            <Melding soort="let-op">Er zijn al AI-voorstellen gemaakt. Als je de criteria wijzigt, laat je die voorstellen het best opnieuw maken.</Melding>
          </div>
        )}
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'samenstellen'} onClick={() => setTab('samenstellen')}>
            Criteria
          </button>
          <button type="button" role="tab" aria-selected={tab === 'plakken'} onClick={() => setTab('plakken')}>
            Eigen rubric plakken
          </button>
        </div>

        {tab === 'plakken' ? (
          <div className="stapel">
            <label className="veld">
              <span>Rubric of antwoordmodel</span>
              <textarea rows={8} value={geplakt} onChange={(e) => setGeplakt(e.target.value)} placeholder={'Inhoud (10 punten)\nOpbouw (8 punten)\nTaalverzorging (6 punten)'} />
              <small>De AI zet de tekst om in criteria met niveaus en punten. Daarna controleer en verbeter je ze zelf.</small>
            </label>
            {omzetten.fout && <Melding soort="fout">{omzetten.fout}</Melding>}
            <div>
              <button type="button" className="knop knop-primair" disabled={!geplakt.trim() || omzetten.bezig} onClick={zetOm}>
                <Wand2 size={18} aria-hidden /> {omzetten.bezig ? 'Bezig met omzetten…' : 'Omzetten naar criteria'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {omzetten.waarschuwingen.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <Melding soort="let-op">
                  <ul>
                    {omzetten.waarschuwingen.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </Melding>
              </div>
            )}
            <RubricEditor criteria={toets.criteria} onChange={(criteria) => zet({ criteria })} />
          </>
        )}
      </section>

      <div className="rij" style={{ marginTop: '2.5rem' }}>
        <button type="submit" className="knop knop-primair">
          {bestaand ? 'Wijzigingen bewaren' : 'Toets aanmaken'}
        </button>
        <Link to={bestaand ? `/toets/${toets.id}` : '/'} className="knop knop-stil">
          Annuleren
        </Link>
      </div>
    </form>
  )
}
