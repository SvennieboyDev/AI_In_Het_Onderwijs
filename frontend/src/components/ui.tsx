// Kleine, herbruikbare bouwstenen.

import { AlertTriangle, CheckCircle2, Info, MoreHorizontal, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { laadAfbeelding } from '../lib/db'
import type { Status } from '../lib/nakijken'

export function StatusLabel({ status }: { status: Pick<Status, 'label' | 'toon'> }) {
  return <span className={`status status-${status.toon}`}>{status.label}</span>
}

const MELDING_ICOON = { info: Info, 'let-op': AlertTriangle, fout: XCircle, goed: CheckCircle2 }

export function Melding({ soort = 'info', children }: { soort?: keyof typeof MELDING_ICOON; children: ReactNode }) {
  const Icoon = MELDING_ICOON[soort]
  return (
    <div className={`melding melding-${soort}`} role={soort === 'fout' ? 'alert' : 'status'}>
      <Icoon size={18} aria-hidden />
      <div>{children}</div>
    </div>
  )
}

/** Afbeelding uit de lokale opslag (IndexedDB). */
export function LokaleAfbeelding({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let actief = true
    let gemaakt: string | undefined
    void laadAfbeelding(id).then((blob) => {
      if (blob && actief) setUrl((gemaakt = URL.createObjectURL(blob)))
    })
    return () => {
      actief = false
      if (gemaakt) URL.revokeObjectURL(gemaakt)
    }
  }, [id])
  return url ? <img src={url} alt={alt} className={className} /> : <span className="zacht klein">Laden…</span>
}

/** Uitklapmenu voor secundaire acties (progressive disclosure). */
export function Menu({ label, items }: { label: string; items: { label: string; icoon?: ReactNode; gevaar?: boolean; actie: () => void }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const sluit = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', sluit)
    document.addEventListener('keydown', sluit)
    ref.current?.querySelector<HTMLButtonElement>('.menu-lijst button')?.focus()
    return () => {
      document.removeEventListener('mousedown', sluit)
      document.removeEventListener('keydown', sluit)
    }
  }, [open])
  return (
    <div className="menu" ref={ref}>
      <button className="knop" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={18} aria-hidden /> {label}
      </button>
      {open && (
        <div className="menu-lijst" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              className={item.gevaar ? 'knop-gevaar' : undefined}
              onClick={() => {
                setOpen(false)
                item.actie()
              }}
            >
              {item.icoon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Dialoog({ open, onSluit, titel, children }: { open: boolean; onSluit: () => void; titel: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onSluit} aria-label={titel}>
      <h2>{titel}</h2>
      {children}
    </dialog>
  )
}

// ---------- Toasts (korte bevestigingen) ----------

interface Toast {
  id: number
  tekst: string
  fout?: boolean
}
const ToastContext = createContext<(tekst: string, fout?: boolean) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toon = useCallback((tekst: string, fout = false) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, tekst, fout }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), fout ? 7000 : 3500)
  }, [])
  return (
    <ToastContext.Provider value={toon}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.fout ? 'toast-fout' : ''}`} role={t.fout ? 'alert' : undefined}>
            {t.tekst}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
