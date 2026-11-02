// Stap 2: de docent controleert per criterium het AI-voorstel en stelt zelf het cijfer vast.
// De AI legt nooit zelf een cijfer vast (human-in-the-loop, PvE-eis 1).

import { ArrowLeft, Check, CheckCheck, ChevronLeft, ChevronRight, Lock, RotateCcw, Sparkles, X } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LokaleAfbeelding, Melding, StatusLabel, useToast } from '../components/ui'
import { berekenCijfer, getal, maxPunten } from '../lib/cijfer'
import { bepaalStatus, heeftScans, maakBeoordeling, werkTekst } from '../lib/nakijken'
import { useSneltoetsen } from '../lib/sneltoetsen'
import { useNaam, useStore } from '../lib/store'
import { vindCitaat } from '../lib/tekst'
import type { Criterium, CriteriumVoorstel, Oordeel, Zekerheid } from '../types'

const ZEKERHEID: Record<Zekerheid, number> = { laag: 1, middel: 2, hoog: 3 }

function ZekerheidMeter({ waarde }: { waarde: Zekerheid }) {
  return (
    <span className="zekerheid">
      <span className="zekerheid-balk" aria-hidden>
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= ZEKERHEID[waarde] ? 'aan' : ''} />
        ))}
      </span>
      Zekerheid AI: {waarde}
    </span>
  )
}

function besluitLabel(o: Oordeel | undefined, v: CriteriumVoorstel | undefined) {
  if (o?.besluit === 'geaccepteerd') return { label: 'Voorstel geaccepteerd', toon: 'goed' as const }
  if (o?.besluit === 'aangepast' && o.niveauId) return { label: v ? 'Aangepast door docent' : 'Beoordeeld door docent', toon: 'goed' as const }
  if (o?.besluit === 'afgewezen') return { label: 'Voorstel afgewezen: kies een niveau', toon: 'let-op' as const }
  if (v?.status === 'docent-moet-beoordelen') return { label: 'Docent moet beoordelen', toon: 'let-op' as const }
  if (v) return { label: 'Voorstel, nog niet gecontroleerd', toon: 'info' as const }
  return { label: 'Nog niet beoordeeld', toon: 'neutraal' as const }
}

export default function Nakijken() {
  const { toetsId, inleveringId } = useParams()
  const { toetsen, inleveringen, leerlingen, instellingen, wijzigInlevering } = useStore()
  const naamVan = useNaam()
  const navigeer = useNavigate()
  const toast = useToast()
  const toets = toetsen.find((t) => t.id === toetsId)
  const inlevering = inleveringen.find((i) => i.id === inleveringId)

  const [actief, setActief] = useState(0)
  const [citaat, setCitaat] = useState<{ tekst: string; teller: number } | null>(null)
  const [weergave, setWeergave] = useState<'tekst' | 'scan'>('tekst')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string>()

  useEffect(() => {
    setActief(0)
    setCitaat(null)
    setFout(undefined)
    setWeergave('tekst')
  }, [inleveringId])

  const reeks = useMemo(
    () => inleveringen.filter((i) => i.toetsId === toetsId).sort((a, b) => a.leerlingcode.localeCompare(b.leerlingcode, 'nl', { numeric: true })),
    [inleveringen, toetsId],
  )
  const positie = reeks.findIndex((i) => i.id === inleveringId)
  const tekst = inlevering ? werkTekst(inlevering) : ''

  const criteria = toets?.criteria ?? []
  const criterium: Criterium | undefined = criteria[actief]
  const voorstelVan = (id: string) => inlevering?.beoordeling?.voorstellen.find((v) => v.criteriumId === id)
  const vastgesteld = inlevering?.cijfer !== undefined

  // Citaten van het gekozen criterium oplichten in de tekst
  const markeringen = useMemo(() => {
    if (!criterium) return []
    return (voorstelVan(criterium.id)?.citaten ?? [])
      .map((c) => ({ citaat: c, positie: vindCitaat(tekst, c) }))
      .filter((m) => m.positie)
      .sort((a, b) => a.positie!.start - b.positie!.start)
  }, [criterium, tekst, inlevering?.beoordeling]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (citaat) document.getElementById('citaat-actief')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [citaat])

  const ga = (stap: number) => {
    const doel = reeks[positie + stap]
    if (!doel || !toets) return
    const code = bepaalStatus(doel, toets).code
    navigeer(`/toets/${toets.id}/${code === 'transcriptie' ? 'transcriptie' : 'nakijken'}/${doel.id}`)
  }

  const zetOordeel = (c: Criterium, oordeel: Oordeel) => {
    if (!inlevering || vastgesteld) return
    wijzigInlevering(inlevering.id, (i) => ({ oordelen: { ...i.oordelen, [c.id]: oordeel } }))
  }
  const kiesNiveau = (c: Criterium, niveauId: string) => {
    const v = voorstelVan(c.id)
    const zelfde = v?.status === 'voorstel' && v.niveauId === niveauId
    zetOordeel(c, { ...inlevering?.oordelen[c.id], niveauId, besluit: zelfde ? 'geaccepteerd' : 'aangepast' })
  }
  const accepteer = (c: Criterium) => {
    const v = voorstelVan(c.id)
    if (v?.status === 'voorstel' && v.niveauId) zetOordeel(c, { niveauId: v.niveauId, besluit: 'geaccepteerd' })
  }
  const wijsAf = (c: Criterium) => {
    if (voorstelVan(c.id)) zetOordeel(c, { niveauId: null, besluit: 'afgewezen' })
  }
  const neemAllesOver = () => {
    if (!inlevering?.beoordeling || vastgesteld) return
    const oordelen = { ...inlevering.oordelen }
    let n = 0
    for (const v of inlevering.beoordeling.voorstellen) {
      if (v.status === 'voorstel' && v.niveauId && !oordelen[v.criteriumId]?.besluit) {
        oordelen[v.criteriumId] = { niveauId: v.niveauId, besluit: 'geaccepteerd' }
        n++
      }
    }
    wijzigInlevering(inlevering.id, { oordelen })
    const open = inlevering.beoordeling.voorstellen.filter((v) => v.status === 'docent-moet-beoordelen' && !oordelen[v.criteriumId]?.niveauId).length
    toast(`${n} ${n === 1 ? 'voorstel' : 'voorstellen'} overgenomen${open ? `; ${open} ${open === 1 ? 'criterium moet' : 'criteria moeten'} je zelf beoordelen` : ''}`)
  }

  const berekening = toets && inlevering ? berekenCijfer(criteria, inlevering, instellingen.cijfer) : null

  const stelVast = () => {
    if (!inlevering || !berekening || berekening.open > 0 || berekening.cijfer === null || vastgesteld) return
    wijzigInlevering(inlevering.id, { cijfer: berekening.cijfer, vastgesteldOp: new Date().toISOString() })
    toast(`Cijfer ${getal(berekening.cijfer, instellingen.cijfer.decimalen)} vastgesteld voor ${inlevering.leerlingcode}`)
    const volgende = reeks.slice(positie + 1).find((i) => i.cijfer === undefined)
    if (volgende && toets) {
      const code = bepaalStatus(volgende, toets).code
      navigeer(`/toets/${toets.id}/${code === 'transcriptie' ? 'transcriptie' : 'nakijken'}/${volgende.id}`)
    }
  }

  useSneltoetsen({
    j: () => ga(1),
    arrowright: () => ga(1),
    k: () => ga(-1),
    arrowleft: () => ga(-1),
    arrowdown: () => setActief((a) => Math.min(criteria.length - 1, a + 1)),
    arrowup: () => setActief((a) => Math.max(0, a - 1)),
    a: () => criterium && accepteer(criterium),
    x: () => criterium && wijsAf(criterium),
    'shift+a': neemAllesOver,
    v: stelVast,
    ...Object.fromEntries(
      Array.from({ length: 9 }, (_, n) => [String(n + 1), () => criterium?.niveaus[n] && kiesNiveau(criterium, criterium.niveaus[n].id)]),
    ),
  })

  useEffect(() => {
    document.getElementById(`criterium-${actief}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [actief])

  if (!toets || !inlevering || !berekening) return <div className="pagina">Dit werk bestaat niet (meer).</div>

  const status = bepaalStatus(inlevering, toets)
  const naam = naamVan(inlevering.leerlingcode)
  const scans = inlevering.paginas.filter((p) => p.soort === 'afbeelding' && p.afbeeldingId)

  async function maakVoorstel() {
    setBezig(true)
    setFout(undefined)
    try {
      wijzigInlevering(inlevering!.id, await maakBeoordeling(inlevering!, toets!, leerlingen, instellingen))
    } catch (e) {
      setFout((e as Error).message)
    } finally {
      setBezig(false)
    }
  }

  // Leerlingwerk met opgelichte citaten
  const werk: ReactNode[] = []
  let vanaf = 0
  markeringen.forEach((m, n) => {
    const { start, eind } = m.positie!
    if (start < vanaf) return
    const isActief = citaat?.tekst === m.citaat
    werk.push(
      <Fragment key={`t${n}`}>{tekst.slice(vanaf, start)}</Fragment>,
      <mark key={`m${n}-${isActief ? citaat?.teller : 0}`} id={isActief ? 'citaat-actief' : undefined} className={isActief ? 'actief flits' : ''}>
        {tekst.slice(start, eind)}
      </mark>,
    )
    vanaf = eind
  })
  werk.push(<Fragment key="rest">{tekst.slice(vanaf)}</Fragment>)

  return (
    <div className="pagina pagina-breed">
      <Link to={`/toets/${toets.id}`} className="terug">
        <ArrowLeft size={16} aria-hidden /> {toets.titel}
      </Link>
      <div className="nakijk-kop">
        <span className="leerling">{inlevering.leerlingcode}</span>
        {naam && <span className="zacht">{naam}</span>}
        <StatusLabel status={status} />
        <div className="rij" style={{ marginLeft: 'auto' }}>
          <span className="zacht klein cijfers">
            {positie + 1} van {reeks.length}
          </span>
          <button className="knop knop-klein" onClick={() => ga(-1)} disabled={positie <= 0} aria-label="Vorige leerling (K)">
            <ChevronLeft size={18} aria-hidden /> Vorige
          </button>
          <button className="knop knop-klein" onClick={() => ga(1)} disabled={positie >= reeks.length - 1} aria-label="Volgende leerling (J)">
            Volgende <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      <div className="nakijk">
        {/* ---------- Leerlingwerk ---------- */}
        <section aria-label="Werk van de leerling">
          {scans.length > 0 && (
            <div className="werk-schakelaar tabs" role="tablist">
              <button role="tab" aria-selected={weergave === 'tekst'} onClick={() => setWeergave('tekst')}>
                Tekst
              </button>
              <button role="tab" aria-selected={weergave === 'scan'} onClick={() => setWeergave('scan')}>
                Originele scan
              </button>
              {heeftScans(inlevering) && (
                <Link to={`/toets/${toets.id}/transcriptie/${inlevering.id}`} className="knop knop-stil knop-klein" style={{ marginLeft: 'auto' }}>
                  Transcriptie aanpassen
                </Link>
              )}
            </div>
          )}
          {weergave === 'scan' ? (
            scans.map((p) => <LokaleAfbeelding key={p.id} id={p.afbeeldingId!} className="scan" alt={`Scan pagina ${p.nummer}`} />)
          ) : tekst.trim() ? (
            <div className="papier">{werk}</div>
          ) : (
            <Melding soort="let-op">Er is nog geen tekst. Controleer eerst de transcriptie.</Melding>
          )}
        </section>

        {/* ---------- Beoordeling per criterium ---------- */}
        <section aria-label="Beoordeling per criterium">
          {!inlevering.beoordeling && (
            <div className="kader kader-vlak stapel" style={{ marginBottom: '1rem' }}>
              <p>Er is nog geen AI-voorstel. Laat de AI een voorstel doen of beoordeel zelf door per criterium een niveau te kiezen.</p>
              {fout && <Melding soort="fout">{fout}</Melding>}
              <div>
                <button className="knop knop-primair" onClick={() => void maakVoorstel()} disabled={bezig || !tekst.trim() || status.code === 'transcriptie'}>
                  <Sparkles size={18} aria-hidden /> {bezig ? 'AI denkt na…' : 'AI-voorstel maken'}
                </button>
              </div>
            </div>
          )}
          {inlevering.beoordeling && inlevering.beoordeling.model === 'demo' && (
            <div style={{ marginBottom: '1rem' }}>
              <Melding soort="let-op">Dit voorstel komt van het demomodel. Het is geen echte beoordeling; het laat alleen zien hoe de tool werkt.</Melding>
            </div>
          )}
          {inlevering.beoordeling && inlevering.beoordeling.waarschuwingen.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <Melding soort="let-op">
                <ul>
                  {inlevering.beoordeling.waarschuwingen.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </Melding>
            </div>
          )}

          <div className="criteria">
            {criteria.map((c, ci) => {
              const v = voorstelVan(c.id)
              const o = inlevering.oordelen[c.id]
              const label = besluitLabel(o, v)
              const gekozen = o?.niveauId ?? null
              return (
                <article
                  key={c.id}
                  id={`criterium-${ci}`}
                  className={`criterium ${ci === actief ? 'gekozen' : ''}`}
                  onFocus={() => setActief(ci)}
                  onClick={() => setActief(ci)}
                  aria-current={ci === actief}
                >
                  <div className="criterium-kop">
                    <h3>{c.naam}</h3>
                    <span className="zacht klein cijfers">max. {getal(maxPunten(c))}</span>
                  </div>
                  <StatusLabel status={label} />
                  {v?.status === 'docent-moet-beoordelen' && v.reden && <p className="klein">{v.reden}</p>}

                  <div className="niveaus" role="group" aria-label={`Niveau voor ${c.naam}`}>
                    {c.niveaus.map((n, ni) => (
                      <button
                        key={n.id}
                        className={`niveau ${v?.status === 'voorstel' && v.niveauId === n.id ? 'ai' : ''}`}
                        aria-pressed={gekozen === n.id}
                        disabled={vastgesteld}
                        title={`${n.omschrijving}${ci === actief ? ` (toets ${ni + 1})` : ''}`}
                        onClick={() => kiesNiveau(c, n.id)}
                      >
                        <span>{n.label}</span>
                        <strong>{getal(n.punten)}</strong>
                      </button>
                    ))}
                  </div>

                  {v && v.citaten.length > 0 && (
                    <div className="citaten">
                      {v.citaten.map((ct) => {
                        const gevonden = !!vindCitaat(tekst, ct)
                        return (
                          <button
                            key={ct}
                            className={`citaat ${gevonden ? '' : 'niet-gevonden'}`}
                            disabled={!gevonden}
                            title={gevonden ? 'Toon in de tekst' : 'Niet teruggevonden in de huidige tekst'}
                            onClick={() => {
                              setActief(ci)
                              setWeergave('tekst')
                              setCitaat((x) => ({ tekst: ct, teller: (x?.teller ?? 0) + 1 }))
                            }}
                          >
                            “{ct}”
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {v?.argumentatie && <p className="argumentatie">{v.argumentatie}</p>}

                  {v && (
                    <div className="besluit">
                      {v.status === 'voorstel' && <ZekerheidMeter waarde={v.zekerheid} />}
                      <span style={{ marginLeft: 'auto' }} />
                      {v.status === 'voorstel' && o?.besluit !== 'geaccepteerd' && (
                        <button className="knop knop-klein" disabled={vastgesteld} onClick={() => accepteer(c)}>
                          <Check size={16} aria-hidden /> Accepteren {ci === actief && <kbd>A</kbd>}
                        </button>
                      )}
                      {v.status === 'voorstel' && o?.besluit !== 'afgewezen' && (
                        <button className="knop knop-klein knop-stil" disabled={vastgesteld} onClick={() => wijsAf(c)}>
                          <X size={16} aria-hidden /> Afwijzen {ci === actief && <kbd>X</kbd>}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          <label className="veld" style={{ marginTop: '1.5rem' }}>
            <span>Feedback voor de leerling</span>
            <textarea
              rows={5}
              value={inlevering.feedback}
              disabled={vastgesteld}
              placeholder="Schrijf hier feedback, of laat de AI een voorstel doen."
              onChange={(e) => wijzigInlevering(inlevering.id, { feedback: e.target.value })}
            />
            <small>Je kunt de feedback vrij aanpassen. Exporteren kan via de toetspagina (Meer).</small>
          </label>
        </section>
      </div>

      {/* ---------- Cijferbalk: altijd zichtbaar ---------- */}
      <div className="cijferbalk" aria-live="polite">
        <span className={`cijfer ${vastgesteld ? '' : 'voorlopig'}`} aria-label="Cijfer">
          {vastgesteld
            ? getal(inlevering.cijfer!, instellingen.cijfer.decimalen)
            : berekening.cijfer !== null && berekening.open === 0
              ? getal(berekening.cijfer, instellingen.cijfer.decimalen)
              : '–'}
        </span>
        <div className="berekening">
          <strong>
            {vastgesteld
              ? 'Vastgesteld door docent'
              : berekening.open > 0
                ? `Nog ${berekening.open} ${berekening.open === 1 ? 'criterium' : 'criteria'} open`
                : 'Klaar om vast te stellen'}
          </strong>
          <span className="zacht cijfers">
            {berekening.open > 0 && !vastgesteld
              ? `Tot nu toe ${getal(berekening.behaald)} van ${getal(berekening.max)} punten. Het cijfer verschijnt als alle criteria beoordeeld zijn.`
              : `${getal(berekening.behaald)} van ${getal(berekening.max)} punten. Cijfer = ${berekening.formule} = ${
                  berekening.cijfer !== null ? getal(berekening.cijfer, instellingen.cijfer.decimalen) : '–'
                }`}
          </span>
        </div>
        <div className="acties">
          {vastgesteld ? (
            <button className="knop" onClick={() => wijzigInlevering(inlevering.id, { cijfer: undefined, vastgesteldOp: undefined })}>
              <RotateCcw size={18} aria-hidden /> Heropenen
            </button>
          ) : (
            <>
              {inlevering.beoordeling && (
                <button className="knop" onClick={neemAllesOver}>
                  <CheckCheck size={18} aria-hidden /> Alle voorstellen overnemen <kbd>Shift A</kbd>
                </button>
              )}
              <button className="knop knop-primair" onClick={stelVast} disabled={berekening.open > 0 || berekening.cijfer === null}>
                <Lock size={18} aria-hidden /> Cijfer vaststellen <kbd>V</kbd>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
