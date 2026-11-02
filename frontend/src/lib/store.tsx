// Centrale app-staat. Elke wijziging wordt automatisch lokaal bewaard (IndexedDB).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Inlevering, Instellingen, Leerling, Staat, Toets } from '../types'
import { bewaarStaat, laadStaat, verwijderAfbeelding, wisAlles } from './db'

export const STANDAARD_INSTELLINGEN: Instellingen = {
  thema: 'systeem',
  tekstgrootte: 100,
  cijfer: { minimum: 1, maximum: 10, decimalen: 1 },
  leesmodel: 'demo',
  beoordelingsmodel: 'demo',
  namenTonen: true,
}

// Weergave-instellingen ook direct (synchroon) in localStorage: zo staan thema en tekstgrootte
// meteen goed bij het laden, ook als de pagina vlak na een wijziging wordt herladen.
const INSTELLINGEN_SLEUTEL = 'nakijkassistent-instellingen'
export function snelleInstellingen(): Partial<Instellingen> {
  try {
    return JSON.parse(localStorage.getItem(INSTELLINGEN_SLEUTEL) ?? '{}')
  } catch {
    return {}
  }
}

const LEGE_STAAT: Staat = { versie: 1, toetsen: [], inleveringen: [], leerlingen: [], instellingen: STANDAARD_INSTELLINGEN }

type Wijziging<T> = Partial<T> | ((oud: T) => Partial<T>)

interface Store extends Staat {
  geladen: boolean
  voegToetsToe: (toets: Toets) => void
  wijzigToets: (id: string, wijziging: Wijziging<Toets>) => void
  verwijderToets: (id: string) => void
  voegInleveringenToe: (nieuw: Inlevering[]) => void
  wijzigInlevering: (id: string, wijziging: Wijziging<Inlevering>) => void
  verwijderInlevering: (id: string) => void
  zetLeerlingen: (leerlingen: Leerling[]) => void
  wijzigInstellingen: (wijziging: Partial<Instellingen>) => void
  vervangAlles: (staat: Staat) => void
  wisAlleGegevens: () => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

function pas<T>(oud: T, wijziging: Wijziging<T>): T {
  return { ...oud, ...(typeof wijziging === 'function' ? wijziging(oud) : wijziging) }
}

function afbeeldingIds(inleveringen: Inlevering[]) {
  return inleveringen.flatMap((i) => i.paginas.map((p) => p.afbeeldingId).filter((id): id is string => !!id))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [staat, setStaat] = useState<Staat>(LEGE_STAAT)
  const [geladen, setGeladen] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    laadStaat()
      .then((s) =>
        setStaat({ ...LEGE_STAAT, ...s, instellingen: { ...STANDAARD_INSTELLINGEN, ...s?.instellingen, ...snelleInstellingen() } }),
      )
      .catch(() => console.warn('Lokale opslag niet beschikbaar; gegevens worden niet bewaard.'))
      .finally(() => setGeladen(true))
  }, [])

  // Bewaar kort na elke wijziging (gebundeld, zodat typen niet traag wordt)
  const laatste = useRef(staat)
  useEffect(() => {
    if (!geladen) return
    laatste.current = staat
    try {
      localStorage.setItem(INSTELLINGEN_SLEUTEL, JSON.stringify(staat.instellingen))
    } catch {
      /* geen localStorage beschikbaar: IndexedDB bewaart het alsnog */
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void bewaarStaat(staat), 150)
  }, [staat, geladen])

  // Bij sluiten of herladen van de pagina direct bewaren, zodat er niets verloren gaat
  useEffect(() => {
    if (!geladen) return
    const nu = () => {
      window.clearTimeout(timer.current)
      void bewaarStaat(laatste.current)
    }
    window.addEventListener('pagehide', nu)
    return () => window.removeEventListener('pagehide', nu)
  }, [geladen])

  const voegToetsToe = useCallback((toets: Toets) => setStaat((s) => ({ ...s, toetsen: [...s.toetsen, toets] })), [])
  const wijzigToets = useCallback(
    (id: string, w: Wijziging<Toets>) => setStaat((s) => ({ ...s, toetsen: s.toetsen.map((t) => (t.id === id ? pas(t, w) : t)) })),
    [],
  )
  const verwijderToets = useCallback((id: string) => {
    setStaat((s) => {
      const weg = s.inleveringen.filter((i) => i.toetsId === id)
      afbeeldingIds(weg).forEach((a) => void verwijderAfbeelding(a))
      return { ...s, toetsen: s.toetsen.filter((t) => t.id !== id), inleveringen: s.inleveringen.filter((i) => i.toetsId !== id) }
    })
  }, [])
  const voegInleveringenToe = useCallback(
    (nieuw: Inlevering[]) => setStaat((s) => ({ ...s, inleveringen: [...s.inleveringen, ...nieuw] })),
    [],
  )
  const wijzigInlevering = useCallback(
    (id: string, w: Wijziging<Inlevering>) =>
      setStaat((s) => ({ ...s, inleveringen: s.inleveringen.map((i) => (i.id === id ? pas(i, w) : i)) })),
    [],
  )
  const verwijderInlevering = useCallback((id: string) => {
    setStaat((s) => {
      afbeeldingIds(s.inleveringen.filter((i) => i.id === id)).forEach((a) => void verwijderAfbeelding(a))
      return { ...s, inleveringen: s.inleveringen.filter((i) => i.id !== id) }
    })
  }, [])
  const zetLeerlingen = useCallback((leerlingen: Leerling[]) => setStaat((s) => ({ ...s, leerlingen })), [])
  const wijzigInstellingen = useCallback(
    (w: Partial<Instellingen>) => setStaat((s) => ({ ...s, instellingen: { ...s.instellingen, ...w } })),
    [],
  )
  const vervangAlles = useCallback((nieuw: Staat) => setStaat(nieuw), [])
  const wisAlleGegevens = useCallback(async () => {
    await wisAlles()
    setStaat(LEGE_STAAT)
  }, [])

  const waarde = useMemo<Store>(
    () => ({
      ...staat,
      geladen,
      voegToetsToe,
      wijzigToets,
      verwijderToets,
      voegInleveringenToe,
      wijzigInlevering,
      verwijderInlevering,
      zetLeerlingen,
      wijzigInstellingen,
      vervangAlles,
      wisAlleGegevens,
    }),
    [staat, geladen, voegToetsToe, wijzigToets, verwijderToets, voegInleveringenToe, wijzigInlevering, verwijderInlevering, zetLeerlingen, wijzigInstellingen, vervangAlles, wisAlleGegevens],
  )

  return <StoreContext.Provider value={waarde}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore moet binnen StoreProvider gebruikt worden')
  return store
}

/** Naam bij een leerlingcode, alleen lokaal. */
export function useNaam() {
  const { leerlingen, instellingen } = useStore()
  return useCallback(
    (code: string) => (instellingen.namenTonen ? leerlingen.find((l) => l.code === code)?.naam ?? null : null),
    [leerlingen, instellingen.namenTonen],
  )
}
