import { Check, Keyboard, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { api, type ModelInfo } from '../lib/api'
import { useSneltoetsen } from '../lib/sneltoetsen'
import { useStore } from '../lib/store'
import { Dialoog } from './ui'

export const SNELTOETSEN_HULP: [string, string][] = [
  ['J of →', 'Volgende leerling'],
  ['K of ←', 'Vorige leerling'],
  ['↓ / ↑', 'Volgend / vorig criterium'],
  ['1 – 9', 'Kies niveau bij het gekozen criterium'],
  ['A', 'Voorstel accepteren'],
  ['X', 'Voorstel afwijzen'],
  ['Shift + A', 'Alle voorstellen overnemen'],
  ['V', 'Cijfer vaststellen'],
  ['Ctrl + Enter', 'Transcriptie bevestigen'],
  ['?', 'Dit overzicht tonen'],
]

function useEffectiefThema() {
  const { instellingen } = useStore()
  const [systeemDonker, setSysteemDonker] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const wissel = () => setSysteemDonker(mq.matches)
    mq.addEventListener('change', wissel)
    return () => mq.removeEventListener('change', wissel)
  }, [])
  return instellingen.thema === 'systeem' ? (systeemDonker ? 'donker' : 'licht') : instellingen.thema
}

export default function Layout() {
  const { instellingen, wijzigInstellingen } = useStore()
  const thema = useEffectiefThema()
  const [hulp, setHulp] = useState(false)
  const [modellen, setModellen] = useState<ModelInfo[] | null>(null)
  const [backendFout, setBackendFout] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.thema = thema
    document.documentElement.style.setProperty('--tekstgrootte', String(instellingen.tekstgrootte))
  }, [thema, instellingen.tekstgrootte])

  useEffect(() => {
    api
      .modellen()
      .then((m) => {
        setModellen(m)
        setBackendFout(false)
      })
      .catch(() => setBackendFout(true))
  }, [])

  useSneltoetsen({ '?': () => setHulp(true) })

  const beoordelaar = modellen?.find((m) => m.id === instellingen.beoordelingsmodel)

  return (
    <>
      <a href="#inhoud" className="sr-only">
        Naar de inhoud
      </a>
      <header className="kop">
        <div className="kop-binnen">
          <NavLink to="/" className="merk">
            <span className="merk-teken" aria-hidden>
              <Check size={16} strokeWidth={3} />
            </span>
            NakijkAssistent
          </NavLink>
          <nav className="nav" aria-label="Hoofdmenu">
            <NavLink to="/" end>
              Toetsen
            </NavLink>
            <NavLink to="/leerlingen">Leerlingen</NavLink>
            <NavLink to="/instellingen">Instellingen</NavLink>
          </nav>
          <div className="kop-rechts">
            <span className="verbinding" title={backendFout ? 'Start de backend; zie README' : undefined}>
              <span className={`verbinding-stip ${backendFout ? 'uit' : ''}`} aria-hidden />
              {backendFout ? 'Backend niet bereikbaar' : beoordelaar ? beoordelaar.naam.replace(' (geen echte AI)', '') : 'Verbinden…'}
            </span>
            <button
              className="knop-icoon"
              aria-label={thema === 'donker' ? 'Lichte modus' : 'Donkere modus'}
              onClick={() => wijzigInstellingen({ thema: thema === 'donker' ? 'licht' : 'donker' })}
            >
              {thema === 'donker' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="knop-icoon" aria-label="Sneltoetsen" onClick={() => setHulp(true)}>
              <Keyboard size={18} />
            </button>
          </div>
        </div>
      </header>
      <main id="inhoud">
        <Outlet />
      </main>
      <Dialoog open={hulp} onSluit={() => setHulp(false)} titel="Sneltoetsen">
        <div className="sneltoetsen">
          {SNELTOETSEN_HULP.map(([toets, uitleg]) => (
            <div key={toets} style={{ display: 'contents' }}>
              <span>
                <kbd>{toets}</kbd>
              </span>
              <span>{uitleg}</span>
            </div>
          ))}
        </div>
        <button className="knop" onClick={() => setHulp(false)}>
          Sluiten
        </button>
      </Dialoog>
    </>
  )
}
