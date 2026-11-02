// Sneltoetsen voor ervaren gebruikers. Ze werken niet terwijl je in een tekstveld typt.

import { useEffect, useRef } from 'react'

export type Sneltoetsen = Record<string, (e: KeyboardEvent) => void>

function inTekstveld(doel: EventTarget | null) {
  const el = doel as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

/** Sleutels zoals 'a', 'shift+a', 'arrowright', 'mod+enter' (mod = Ctrl of Cmd). */
export function useSneltoetsen(toetsen: Sneltoetsen, actief = true) {
  const ref = useRef(toetsen)
  ref.current = toetsen
  useEffect(() => {
    if (!actief) return
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const sleutel = `${mod ? 'mod+' : ''}${e.shiftKey && e.key.length > 1 ? 'shift+' : ''}${e.key.toLowerCase()}`
      const metShift = e.shiftKey && e.key.length === 1 ? `shift+${e.key.toLowerCase()}` : null
      const actie = (metShift && ref.current[metShift]) || ref.current[sleutel]
      if (!actie) return
      if (inTekstveld(e.target) && !mod && e.key !== 'Escape') return
      if (document.querySelector('dialog[open]') && e.key !== '?') return
      e.preventDefault()
      actie(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [actief])
}
