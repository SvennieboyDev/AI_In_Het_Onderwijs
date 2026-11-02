// Werk van leerlingen toevoegen: slepen-en-neerzetten, verwerken, pagina's aan leerlingen koppelen.

import { CheckCircle2, FileText, Loader2, Upload, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { api, base64NaarBlob } from '../lib/api'
import { bewaarAfbeelding } from '../lib/db'
import { codeUitBestandsnaam, maakId, volgendeCode } from '../lib/id'
import { useStore } from '../lib/store'
import type { Inlevering, Pagina, Toets } from '../types'
import { Melding, useToast } from './ui'

const EXTENSIES = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const MAX_MB = 25
const CODE_PATROON = /^[A-Za-z0-9_-]{1,16}$/

interface VerwerktePagina {
  nummer: number
  soort: 'tekst' | 'afbeelding'
  tekst?: string
  blob?: Blob
  url?: string
}

interface Bestand {
  id: string
  naam: string
  status: 'bezig' | 'klaar' | 'fout'
  fout?: string
  waarschuwingen: string[]
  paginas: VerwerktePagina[]
  perLeerling: number
  codes: string[]
}

const groepen = (b: Bestand) => {
  const uit: VerwerktePagina[][] = []
  for (let i = 0; i < b.paginas.length; i += b.perLeerling) uit.push(b.paginas.slice(i, i + b.perLeerling))
  return uit
}

async function dekAf(blob: Blob, fractie: number): Promise<Blob> {
  const beeld = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = beeld.width
  canvas.height = beeld.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(beeld, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, beeld.width, Math.round(beeld.height * fractie))
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', 0.9))
}

export default function UploadPaneel({ toets, onKlaar }: { toets: Toets; onKlaar: () => void }) {
  const { inleveringen, voegInleveringenToe, wijzigInlevering } = useStore()
  const toast = useToast()
  const invoer = useRef<HTMLInputElement>(null)
  const [bestanden, setBestanden] = useState<Bestand[]>([])
  const [sleept, setSleept] = useState(false)
  const [afdekken, setAfdekken] = useState(true)
  const [afdekPct, setAfdekPct] = useState(12)
  const [fout, setFout] = useState<string>()

  const bestaandeCodes = inleveringen.filter((i) => i.toetsId === toets.id).map((i) => i.leerlingcode)

  useEffect(() => () => bestanden.forEach((b) => b.paginas.forEach((p) => p.url && URL.revokeObjectURL(p.url))), []) // eslint-disable-line

  const wijzig = (id: string, w: Partial<Bestand> | ((b: Bestand) => Partial<Bestand>)) =>
    setBestanden((lijst) => lijst.map((b) => (b.id === id ? { ...b, ...(typeof w === 'function' ? w(b) : w) } : b)))

  function codesVoor(b: Pick<Bestand, 'naam' | 'paginas' | 'perLeerling'>, bezet: string[]): string[] {
    const aantal = Math.ceil(b.paginas.length / b.perLeerling)
    const uitNaam = codeUitBestandsnaam(b.naam)
    const codes: string[] = []
    for (let i = 0; i < aantal; i++) {
      const code = aantal === 1 && uitNaam ? uitNaam : volgendeCode([...bezet, ...codes])
      codes.push(code)
    }
    return codes
  }

  async function voegToe(lijst: FileList | File[]) {
    setFout(undefined)
    const nieuw: Bestand[] = [...lijst].map((f) => ({ id: maakId('b'), naam: f.name, status: 'bezig', waarschuwingen: [], paginas: [], perLeerling: 1, codes: [] }))
    setBestanden((b) => [...b, ...nieuw])
    const bezet = [...bestaandeCodes, ...bestanden.flatMap((b) => b.codes)]

    for (const [index, file] of [...lijst].entries()) {
      const id = nieuw[index].id
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!EXTENSIES.includes(ext)) {
        wijzig(id, { status: 'fout', fout: `Dit bestandstype (${ext}) wordt niet ondersteund. Gebruik PDF, Word, tekst of een foto.` })
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        wijzig(id, { status: 'fout', fout: `Te groot (${Math.round(file.size / 1024 / 1024)} MB). De grens is ${MAX_MB} MB.` })
        continue
      }
      if (file.size === 0) {
        wijzig(id, { status: 'fout', fout: 'Dit bestand is leeg.' })
        continue
      }
      try {
        const r = await api.bestand(file)
        const paginas: VerwerktePagina[] = await Promise.all(
          r.paginas.map(async (p) => {
            if (p.soort === 'tekst') return { nummer: p.nummer, soort: 'tekst' as const, tekst: p.tekst ?? '' }
            const blob = await base64NaarBlob(p.afbeelding!)
            return { nummer: p.nummer, soort: 'afbeelding' as const, blob, url: URL.createObjectURL(blob) }
          }),
        )
        const basis = { naam: file.name, paginas, perLeerling: paginas.length }
        const codes = codesVoor(basis, bezet)
        bezet.push(...codes)
        wijzig(id, { ...basis, status: 'klaar', waarschuwingen: r.waarschuwingen, codes })
      } catch (e) {
        wijzig(id, { status: 'fout', fout: (e as Error).message })
      }
    }
  }

  function zetPerLeerling(b: Bestand, aantal: number) {
    const perLeerling = Math.min(Math.max(1, aantal || 1), b.paginas.length)
    const anderen = [...bestaandeCodes, ...bestanden.filter((x) => x.id !== b.id).flatMap((x) => x.codes)]
    wijzig(b.id, { perLeerling, codes: codesVoor({ ...b, perLeerling }, anderen) })
  }

  const klaar = bestanden.filter((b) => b.status === 'klaar')
  const alleCodes = klaar.flatMap((b) => b.codes.map((c) => c.trim()))
  const ongeldig = alleCodes.filter((c) => !CODE_PATROON.test(c))
  const dubbel = alleCodes.filter((c, i) => alleCodes.indexOf(c) !== i)

  async function bevestig() {
    if (ongeldig.length) {
      setFout('Gebruik bij elke leerling een leerlingnummer of code: letters en cijfers, zonder spaties. Geen namen (privacy).')
      return
    }
    if (dubbel.length) {
      setFout(`De code ${dubbel[0]} komt meer dan één keer voor. Zet pagina's van één leerling in één groep.`)
      return
    }
    const nieuweInleveringen: Inlevering[] = []
    let toegevoegdAanBestaand = 0
    for (const b of klaar) {
      for (const [gi, groep] of groepen(b).entries()) {
        const code = b.codes[gi].trim()
        const paginas: Pagina[] = []
        for (const [pi, p] of groep.entries()) {
          const pagina: Pagina = { id: maakId('p'), bestandsnaam: b.naam, nummer: p.nummer, soort: p.soort, tekst: p.tekst }
          if (p.blob) {
            // Naamvak afdekken vóór opslag: de onafgedekte versie wordt nergens bewaard
            const blob = afdekken && pi === 0 ? await dekAf(p.blob, afdekPct / 100) : p.blob
            pagina.afbeeldingId = maakId('img')
            await bewaarAfbeelding(pagina.afbeeldingId, blob)
          }
          paginas.push(pagina)
        }
        const bestaand = inleveringen.find((i) => i.toetsId === toets.id && i.leerlingcode === code)
        if (bestaand) {
          toegevoegdAanBestaand++
          wijzigInlevering(bestaand.id, (i) => ({
            paginas: [...i.paginas, ...paginas],
            transcriptie: undefined,
            beoordeling: undefined,
            oordelen: {},
            cijfer: undefined,
          }))
        } else {
          nieuweInleveringen.push({
            id: maakId('i'),
            toetsId: toets.id,
            leerlingcode: code,
            paginas,
            oordelen: {},
            feedback: '',
            aangemaaktOp: new Date().toISOString(),
          })
        }
      }
    }
    voegInleveringenToe(nieuweInleveringen)
    toast(
      `${nieuweInleveringen.length} leerling(en) toegevoegd` + (toegevoegdAanBestaand ? `, ${toegevoegdAanBestaand} aangevuld` : ''),
    )
    setBestanden([])
    onKlaar()
  }

  const opDrop = (e: DragEvent) => {
    e.preventDefault()
    setSleept(false)
    if (e.dataTransfer.files.length) void voegToe(e.dataTransfer.files)
  }

  const heeftScans = klaar.some((b) => b.paginas.some((p) => p.soort === 'afbeelding'))

  return (
    <section className="sectie stapel" aria-label="Werk toevoegen">
      <div
        className={`sleepvak ${sleept ? 'actief' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => invoer.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), invoer.current?.click())}
        onDragOver={(e) => (e.preventDefault(), setSleept(true))}
        onDragLeave={() => setSleept(false)}
        onDrop={opDrop}
      >
        <Upload size={28} aria-hidden />
        <strong>Sleep bestanden hierheen of klik om te kiezen</strong>
        <span className="zacht klein">PDF, Word, tekst of foto's (ook HEIC van een iPhone), tot {MAX_MB} MB per bestand. Een hele stapel scans mag ook.</span>
        <input
          ref={invoer}
          type="file"
          multiple
          hidden
          accept={EXTENSIES.join(',')}
          onChange={(e) => {
            if (e.target.files?.length) void voegToe(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {bestanden.length > 0 && (
        <div>
          {bestanden.map((b) => (
            <div key={b.id}>
              <div className="bestandsrij">
                {b.status === 'bezig' ? (
                  <Loader2 size={18} className="draai" aria-label="Bezig" />
                ) : b.status === 'fout' ? (
                  <XCircle size={18} color="var(--fout)" aria-label="Fout" />
                ) : (
                  <CheckCircle2 size={18} color="var(--goed)" aria-label="Klaar" />
                )}
                <div>
                  <strong>{b.naam}</strong>
                  {b.status === 'fout' && <div className="foutmelding">{b.fout}</div>}
                  {b.waarschuwingen.map((w) => (
                    <div key={w} className="status status-let-op" style={{ fontWeight: 400 }}>
                      {w}
                    </div>
                  ))}
                </div>
                <span className="zacht">
                  {b.status === 'bezig' ? 'Verwerken…' : b.status === 'klaar' ? `${b.paginas.length} ${b.paginas.length === 1 ? 'pagina' : "pagina's"}` : ''}
                  {b.status === 'fout' && (
                    <button className="knop knop-stil knop-klein" onClick={() => setBestanden((l) => l.filter((x) => x.id !== b.id))}>
                      Weghalen
                    </button>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {klaar.length > 0 && (
        <div className="stapel">
          <div>
            <h2>Pagina's koppelen aan leerlingen</h2>
            <p className="zacht klein">
              Gebruik leerlingnummers of codes, geen namen. Namen koppel je alleen op deze computer, bij Leerlingen.
            </p>
          </div>
          {heeftScans && (
            <div className="rij klein">
              <label className="rij" style={{ gap: '0.4rem' }}>
                <input type="checkbox" checked={afdekken} onChange={(e) => setAfdekken(e.target.checked)} />
                Naamvak afdekken: bovenste
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={afdekPct}
                aria-label="Percentage van de pagina dat wordt afgedekt"
                style={{ width: '4.5rem', minHeight: '2rem', padding: '0.2rem 0.4rem' }}
                disabled={!afdekken}
                onChange={(e) => setAfdekPct(Math.min(40, Math.max(0, Number(e.target.value))))}
              />
              <span>% van de eerste pagina per leerling</span>
            </div>
          )}
          {klaar.map((b) => (
            <div key={b.id}>
              {b.paginas.length > 1 && (
                <label className="rij klein" style={{ marginTop: '0.75rem' }}>
                  <strong>{b.naam}:</strong> elke
                  <input
                    type="number"
                    min={1}
                    max={b.paginas.length}
                    value={b.perLeerling}
                    style={{ width: '4.5rem', minHeight: '2rem', padding: '0.2rem 0.4rem' }}
                    onChange={(e) => zetPerLeerling(b, Number(e.target.value))}
                  />
                  pagina('s) is één leerling
                </label>
              )}
              {groepen(b).map((groep, gi) => {
                const code = b.codes[gi] ?? ''
                const codeFout = !CODE_PATROON.test(code.trim()) || dubbel.includes(code.trim())
                return (
                  <div key={gi} className="groep">
                    <label className={`veld ${codeFout ? 'veld-fout' : ''}`}>
                      <span>Leerlingcode</span>
                      <input
                        value={code}
                        onChange={(e) => wijzig(b.id, (x) => ({ codes: x.codes.map((c, i) => (i === gi ? e.target.value : c)) }))}
                      />
                      {bestaandeCodes.includes(code.trim()) && <small>Bestaat al: pagina's worden toegevoegd</small>}
                    </label>
                    <div className="miniaturen">
                      {groep.map((p, pi) => (
                        <div key={p.nummer} className="miniatuur" title={`${b.naam}, pagina ${p.nummer}`}>
                          {p.url ? (
                            <>
                              <img src={p.url} alt={`Pagina ${p.nummer}`} />
                              {afdekken && pi === 0 && (
                                <div style={{ position: 'absolute', inset: 0, height: `${afdekPct}%`, background: '#000' }} aria-hidden />
                              )}
                            </>
                          ) : (
                            <FileText size={22} aria-label="Getypte tekst" />
                          )}
                          <span>{p.nummer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {fout && <Melding soort="fout">{fout}</Melding>}
          {heeftScans && afdekken && (
            <Melding>Het afgedekte deel wordt zwart gemaakt voordat de pagina wordt opgeslagen. Het AI-model ziet het dus nooit.</Melding>
          )}
          <div className="rij">
            <button className="knop knop-primair" onClick={() => void bevestig()} disabled={bestanden.some((b) => b.status === 'bezig')}>
              {klaar.reduce((n, b) => n + b.codes.length, 0)} leerling(en) toevoegen aan toets
            </button>
            <button className="knop knop-stil" onClick={() => setBestanden([])}>
              Annuleren
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
