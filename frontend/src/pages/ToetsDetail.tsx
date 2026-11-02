import { ArrowLeft, Download, FileText, Image, Pencil, Play, Sparkles, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import UploadPaneel from '../components/UploadPaneel'
import { Melding, Menu, StatusLabel, useToast } from '../components/ui'
import { berekenCijfer, getal, totaalMax } from '../lib/cijfer'
import { bepaalStatus, maakBeoordeling, maakTranscriptie, type StatusCode } from '../lib/nakijken'
import { useNaam, useStore } from '../lib/store'
import type { Inlevering, Toets } from '../types'

const VOLGORDE: StatusCode[] = ['docent', 'controle', 'vaststellen', 'transcriptie', 'beoordelen', 'vastgesteld']

export function linkNaarInlevering(toets: Toets, i: Inlevering) {
  const code = bepaalStatus(i, toets).code
  return `/toets/${toets.id}/${code === 'transcriptie' ? 'transcriptie' : 'nakijken'}/${i.id}`
}

function download(naam: string, inhoud: string, type: string) {
  const url = URL.createObjectURL(new Blob(['﻿', inhoud], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: naam })
  a.click()
  URL.revokeObjectURL(url)
}

export default function ToetsDetail() {
  const { toetsId } = useParams()
  const store = useStore()
  const { toetsen, inleveringen, instellingen, leerlingen, wijzigInlevering, verwijderInlevering, verwijderToets } = store
  const naamVan = useNaam()
  const navigeer = useNavigate()
  const toast = useToast()
  const toets = toetsen.find((t) => t.id === toetsId)
  const werk = inleveringen.filter((i) => i.toetsId === toetsId)
  const [uploaden, setUploaden] = useState(werk.length === 0)
  const [bezig, setBezig] = useState<{ tekst: string; klaar: number; totaal: number } | null>(null)
  const [fouten, setFouten] = useState<string[]>([])

  if (!toets) return <div className="pagina">Deze toets bestaat niet (meer). <Link to="/">Naar toetsen</Link></div>

  const metStatus = werk
    .map((i) => ({ i, status: bepaalStatus(i, toets) }))
    .sort((a, b) => VOLGORDE.indexOf(a.status.code) - VOLGORDE.indexOf(b.status.code) || a.i.leerlingcode.localeCompare(b.i.leerlingcode))
  const teLezen = metStatus.filter((x) => x.status.code === 'transcriptie' && !x.i.transcriptie)
  const teBeoordelen = metStatus.filter((x) => x.status.code === 'beoordelen')
  const vastgesteld = metStatus.filter((x) => x.status.code === 'vastgesteld').length
  const eerstVolgende = metStatus.find((x) => x.status.code !== 'vastgesteld')

  async function voorAlle(lijst: Inlevering[], tekst: string, actie: (i: Inlevering) => Promise<Partial<Inlevering>>) {
    const nieuweFouten: string[] = []
    setBezig({ tekst, klaar: 0, totaal: lijst.length })
    for (const [n, i] of lijst.entries()) {
      try {
        wijzigInlevering(i.id, await actie(i))
      } catch (e) {
        nieuweFouten.push(`${i.leerlingcode}: ${(e as Error).message}`)
        if ((e as Error).message.includes('niet bereikbaar')) break
      }
      setBezig({ tekst, klaar: n + 1, totaal: lijst.length })
    }
    setBezig(null)
    setFouten(nieuweFouten)
    if (!nieuweFouten.length) toast(`${tekst}: klaar`)
  }

  const leesAlles = () =>
    voorAlle(teLezen.map((x) => x.i), 'Handschrift lezen', async (i) => ({ transcriptie: await maakTranscriptie(i, instellingen, toets.vak) }))
  const beoordeelAlles = () =>
    voorAlle(teBeoordelen.map((x) => x.i), 'AI-voorstellen maken', (i) => maakBeoordeling(i, toets, leerlingen, instellingen))

  function exporteerCijfers() {
    const regels = [['Leerlingcode', 'Naam', 'Cijfer', 'Behaald', 'Maximum', 'Status', 'Feedback'].join(';')]
    for (const { i, status } of metStatus) {
      const b = berekenCijfer(toets!.criteria, i, instellingen.cijfer)
      const velden = [i.leerlingcode, naamVan(i.leerlingcode) ?? '', i.cijfer !== undefined ? getal(i.cijfer, instellingen.cijfer.decimalen) : '', getal(b.behaald), getal(b.max), status.label, i.feedback]
      regels.push(velden.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    }
    download(`${toets!.titel} - cijfers.csv`, regels.join('\r\n'), 'text/csv;charset=utf-8')
  }

  function exporteerFeedback() {
    const blokken = metStatus
      .filter(({ i }) => i.cijfer !== undefined)
      .map(({ i }) => `${i.leerlingcode}${naamVan(i.leerlingcode) ? ` (${naamVan(i.leerlingcode)})` : ''}\nCijfer: ${getal(i.cijfer!, instellingen.cijfer.decimalen)}\n\n${i.feedback}`)
    if (!blokken.length) return toast('Er zijn nog geen vastgestelde cijfers om te exporteren.', true)
    download(`${toets!.titel} - feedback.txt`, blokken.join('\n\n----------\n\n'), 'text/plain;charset=utf-8')
  }

  return (
    <div className="pagina">
      <Link to="/" className="terug">
        <ArrowLeft size={16} aria-hidden /> Toetsen
      </Link>
      <div className="pagina-kop">
        <div>
          <h1>{toets.titel}</h1>
          <p className="zacht">
            {[toets.klas, toets.vak, `${toets.criteria.length} criteria`, `${getal(totaalMax(toets.criteria))} punten`].filter(Boolean).join(', ')}
          </p>
        </div>
        <div className="rij">
          {werk.length > 0 && (
            <button className="knop" onClick={() => setUploaden(!uploaden)} aria-expanded={uploaden}>
              <Upload size={18} aria-hidden /> Werk toevoegen
            </button>
          )}
          <Menu
            label="Meer"
            items={[
              { label: 'Toets en rubric bewerken', icoon: <Pencil size={16} />, actie: () => navigeer(`/toets/${toets.id}/opzet`) },
              { label: 'Cijferlijst exporteren (CSV)', icoon: <Download size={16} />, actie: exporteerCijfers },
              { label: 'Feedback exporteren (tekst)', icoon: <Download size={16} />, actie: exporteerFeedback },
              {
                label: 'Toets verwijderen',
                icoon: <Trash2 size={16} />,
                gevaar: true,
                actie: () => {
                  if (confirm(`"${toets.titel}" en al het werk erbij verwijderen? Dit kan niet ongedaan worden.`)) {
                    verwijderToets(toets.id)
                    navigeer('/')
                  }
                },
              },
            ]}
          />
          {eerstVolgende && (
            <Link to={linkNaarInlevering(toets, eerstVolgende.i)} className="knop knop-primair">
              <Play size={18} aria-hidden /> Nakijken
            </Link>
          )}
        </div>
      </div>

      {uploaden && <UploadPaneel toets={toets} onKlaar={() => setUploaden(false)} />}

      {(teLezen.length > 0 || teBeoordelen.length > 0 || bezig) && (
        <section className="sectie kader kader-vlak rij" style={{ justifyContent: 'space-between' }}>
          {bezig ? (
            <span role="status" className="cijfers">
              {bezig.tekst}: {bezig.klaar} van {bezig.totaal}…
            </span>
          ) : (
            <>
              <span>
                {teLezen.length > 0 && `${teLezen.length} handgeschreven werk(en) nog niet gelezen. `}
                {teBeoordelen.length > 0 && `${teBeoordelen.length} werk(en) klaar voor een AI-voorstel.`}
              </span>
              <div className="rij">
                {teLezen.length > 0 && (
                  <button className="knop" onClick={() => void leesAlles()}>
                    <Image size={18} aria-hidden /> Handschrift laten lezen
                  </button>
                )}
                {teBeoordelen.length > 0 && (
                  <button className="knop knop-primair" onClick={() => void beoordeelAlles()}>
                    <Sparkles size={18} aria-hidden /> AI-voorstellen maken
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}
      {fouten.length > 0 && (
        <div className="sectie">
          <Melding soort="fout">
            <strong>Niet alles is gelukt</strong>
            <ul>
              {fouten.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Melding>
        </div>
      )}

      {werk.length > 0 && (
        <section className="sectie">
          <div className="rij" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2>Leerlingwerk</h2>
            <span className="zacht klein cijfers">
              {vastgesteld} van {werk.length} vastgesteld
            </span>
          </div>
          <table className="tabel">
            <thead>
              <tr>
                <th>Leerling</th>
                <th>Werk</th>
                <th>Status</th>
                <th className="rechts">Cijfer</th>
                <th>
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {metStatus.map(({ i, status }) => {
                const scans = i.paginas.filter((p) => p.soort === 'afbeelding').length
                const naam = naamVan(i.leerlingcode)
                const b = berekenCijfer(toets.criteria, i, instellingen.cijfer)
                return (
                  <tr key={i.id}>
                    <td>
                      <Link to={linkNaarInlevering(toets, i)}>
                        <strong>{i.leerlingcode}</strong>
                      </Link>
                      {naam && <span className="zacht"> {naam}</span>}
                    </td>
                    <td className="zacht">
                      <span className="rij" style={{ gap: '0.35rem' }}>
                        {scans ? <Image size={15} aria-hidden /> : <FileText size={15} aria-hidden />}
                        {scans ? `${scans} scan(s)` : 'Getypt'}
                      </span>
                    </td>
                    <td>
                      <StatusLabel status={status} />
                    </td>
                    <td className="rechts cijfers">
                      {i.cijfer !== undefined ? (
                        <strong>{getal(i.cijfer, instellingen.cijfer.decimalen)}</strong>
                      ) : i.beoordeling && b.cijfer !== null && b.open === 0 ? (
                        <span className="zacht">{getal(b.cijfer, instellingen.cijfer.decimalen)}</span>
                      ) : (
                        <span className="zacht">–</span>
                      )}
                    </td>
                    <td className="rechts">
                      <button
                        className="knop-icoon"
                        aria-label={`Werk van ${i.leerlingcode} verwijderen`}
                        onClick={() => confirm(`Werk van ${i.leerlingcode} verwijderen?`) && verwijderInlevering(i.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
