// Stap 1: de docent controleert de herkende tekst naast de originele scan.
// Onzekere woorden zijn oranje gemarkeerd. Bij bevestigen meet de tool het foutpercentage (CER).

import { ArrowLeft, Check, ChevronDown, Image as ImageIcon, Keyboard } from 'lucide-react'
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LokaleAfbeelding, Melding, useToast } from '../components/ui'
import { getal } from '../lib/cijfer'
import { bepaalStatus, maakTranscriptie } from '../lib/nakijken'
import { useSneltoetsen } from '../lib/sneltoetsen'
import { useNaam, useStore } from '../lib/store'
import { meetCER, telWoorden, vindOnzeker } from '../lib/tekst'

export default function Transcriptie() {
  const { toetsId, inleveringId } = useParams()
  const { toetsen, inleveringen, instellingen, wijzigInlevering } = useStore()
  const naamVan = useNaam()
  const navigeer = useNavigate()
  const toast = useToast()
  const toets = toetsen.find((t) => t.id === toetsId)
  const inlevering = inleveringen.find((i) => i.id === inleveringId)
  const veld = useRef<HTMLTextAreaElement>(null)
  const achter = useRef<HTMLDivElement>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string>()

  const t = inlevering?.transcriptie
  const posities = useMemo(
    () =>
      (t?.onzeker ?? [])
        .map((o) => vindOnzeker(t!.tekst, o))
        .filter((p): p is { start: number; eind: number } => !!p)
        .sort((a, b) => a.start - b.start),
    [t],
  )

  const bevestig = () => {
    if (!inlevering || !t || !toets) return
    const meting = t.origineel.trim() && t.model !== 'handmatig' ? meetCER(t.origineel, t.tekst) : undefined
    const tekstGewijzigd = inlevering.beoordeling && t.bevestigd === false
    wijzigInlevering(inlevering.id, {
      transcriptie: { ...t, bevestigd: true, meting },
      ...(tekstGewijzigd ? { beoordeling: undefined, oordelen: {} } : {}),
    })
    toast(meting ? `Transcriptie bevestigd. Leesfouten: ${getal(meting.cer * 100, 1)}% (CER)` : 'Transcriptie bevestigd')
    const volgende = inleveringen.find((i) => i.toetsId === toets.id && i.id !== inlevering.id && bepaalStatus(i, toets).code === 'transcriptie')
    navigeer(volgende ? `/toets/${toets.id}/transcriptie/${volgende.id}` : `/toets/${toets.id}`)
  }

  function naarVolgendOnzeker() {
    const el = veld.current
    if (!el || !posities.length) return
    const p = posities.find((x) => x.start > el.selectionStart) ?? posities[0]
    el.focus()
    el.setSelectionRange(p.start, p.eind)
  }

  useSneltoetsen({ 'mod+enter': bevestig, 'mod+arrowdown': naarVolgendOnzeker })

  if (!toets || !inlevering) return <div className="pagina">Dit werk bestaat niet (meer).</div>
  const scans = inlevering.paginas.filter((p) => p.soort === 'afbeelding' && p.afbeeldingId)
  const naam = naamVan(inlevering.leerlingcode)

  async function laatLezen() {
    setBezig(true)
    setFout(undefined)
    try {
      wijzigInlevering(inlevering!.id, { transcriptie: await maakTranscriptie(inlevering!, instellingen, toets!.vak) })
    } catch (e) {
      setFout((e as Error).message)
    } finally {
      setBezig(false)
    }
  }

  const zelfTypen = () =>
    wijzigInlevering(inlevering.id, {
      transcriptie: { model: 'handmatig', origineel: '', onzeker: [], tekst: '', bevestigd: false },
    })

  const zetTekst = (tekst: string) => wijzigInlevering(inlevering.id, { transcriptie: { ...t!, tekst, bevestigd: false } })

  // Achtergrondlaag met markeringen, exact onder de tekst van het invoerveld
  const markeringen: ReactNode[] = []
  if (t) {
    let vanaf = 0
    posities.forEach((p, n) => {
      if (p.start < vanaf) return
      markeringen.push(<Fragment key={`t${n}`}>{t.tekst.slice(vanaf, p.start)}</Fragment>, <mark key={`m${n}`}>{t.tekst.slice(p.start, p.eind)}</mark>)
      vanaf = p.eind
    })
    markeringen.push(<Fragment key="rest">{t.tekst.slice(vanaf)}{'\n'}</Fragment>)
  }

  return (
    <div className="pagina pagina-breed">
      <Link to={`/toets/${toets.id}`} className="terug">
        <ArrowLeft size={16} aria-hidden /> {toets.titel}
      </Link>
      <div className="nakijk-kop">
        <span className="leerling">{inlevering.leerlingcode}</span>
        {naam && <span className="zacht">{naam}</span>}
        <span className="status status-info">Transcriptie controleren</span>
        {t && (
          <div className="rij" style={{ marginLeft: 'auto' }}>
            {posities.length > 0 && (
              <button className="knop" onClick={naarVolgendOnzeker}>
                <ChevronDown size={18} aria-hidden /> Volgend onzeker woord ({posities.length})
              </button>
            )}
            <button className="knop knop-primair" onClick={bevestig} disabled={!t.tekst.trim()}>
              <Check size={18} aria-hidden /> Tekst klopt, bevestigen <kbd>Ctrl Enter</kbd>
            </button>
          </div>
        )}
      </div>

      <div className="transcriptie">
        <div className="scankolom" aria-label="Originele scan">
          {scans.length ? (
            scans.map((p) => <LokaleAfbeelding key={p.id} id={p.afbeeldingId!} alt={`Scan pagina ${p.nummer} van ${inlevering.leerlingcode}`} />)
          ) : (
            <p className="zacht">Geen scans bij dit werk.</p>
          )}
        </div>

        <div className="stapel">
          {!t ? (
            <div className="leeg">
              <ImageIcon size={28} aria-hidden />
              <h2>Nog niet gelezen</h2>
              <p>Laat het leesmodel de tekst overschrijven. Daarna controleer je de tekst hier naast de scan.</p>
              {fout && <Melding soort="fout">{fout}</Melding>}
              <div className="rij">
                <button className="knop knop-primair" onClick={() => void laatLezen()} disabled={bezig}>
                  {bezig ? 'Bezig met lezen…' : 'Handschrift laten lezen'}
                </button>
                <button className="knop" onClick={zelfTypen}>
                  <Keyboard size={18} aria-hidden /> Zelf overtypen
                </button>
              </div>
            </div>
          ) : (
            <>
              {t.opmerking && <Melding soort={t.tekst.trim() ? 'info' : 'let-op'}>{t.opmerking}</Melding>}
              {!t.tekst.trim() && t.model !== 'handmatig' && (
                <Melding soort="let-op">
                  <strong>Docent moet transcriberen.</strong> Het model kon deze pagina niet lezen. Typ de tekst over, of probeer een betere scan.
                </Melding>
              )}
              <div className="editor">
                <div className="editor-achter" ref={achter} aria-hidden>
                  {markeringen}
                </div>
                <textarea
                  ref={veld}
                  aria-label="Herkende tekst, bewerkbaar"
                  spellCheck={false}
                  value={t.tekst}
                  onChange={(e) => zetTekst(e.target.value)}
                  onScroll={(e) => {
                    if (achter.current) achter.current.scrollTop = e.currentTarget.scrollTop
                  }}
                />
              </div>
              <p className="zacht klein">
                {telWoorden(t.tekst)} woorden. Gelezen door: {t.model === 'handmatig' ? 'docent (overgetypt)' : t.model}.{' '}
                {posities.length > 0
                  ? 'Oranje woorden zijn onzeker; verbeter ze waar nodig. De markering verdwijnt als je het woord aanpast.'
                  : 'Verbeter alleen leesfouten; spelfouten van de leerling laat je staan.'}
              </p>
              {t.model !== 'handmatig' && t.origineel && (
                <button className="knop knop-stil knop-klein" style={{ justifySelf: 'start' }} onClick={() => void laatLezen()} disabled={bezig}>
                  Opnieuw laten lezen
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
