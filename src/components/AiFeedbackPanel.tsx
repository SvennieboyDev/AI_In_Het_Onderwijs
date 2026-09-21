import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { AiFeedback } from '../data/mockData'

type Props = {
  aiFeedback: AiFeedback
  onGebruikAlsFeedback: () => void
}

export default function AiFeedbackPanel({ aiFeedback, onGebruikAlsFeedback }: Props) {
  return (
    <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-paars-600 to-paars-400 text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2b1245]">AI-conceptfeedback</h2>
            <p className="text-xs text-paars-400">
              Een startpunt voor jouw beoordeling — geen eindoordeel.
            </p>
          </div>
        </div>
        <button
          onClick={onGebruikAlsFeedback}
          className="rounded-lg border border-paars-200 px-3 py-1.5 text-xs font-medium text-paars-700 hover:bg-paars-50"
        >
          Gebruik als basis voor feedback
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <ThumbsUp size={14} /> Wat gaat goed
          </p>
          <ul className="flex flex-col gap-2">
            {aiFeedback.sterkePunten.map((punt) => (
              <li
                key={punt}
                className="rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-snug text-emerald-900"
              >
                {punt}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-700">
            <ThumbsDown size={14} /> Wat kan beter
          </p>
          <ul className="flex flex-col gap-2">
            {aiFeedback.verbeterpunten.map((punt) => (
              <li
                key={punt}
                className="rounded-xl bg-amber-50 px-3 py-2 text-sm leading-snug text-amber-900"
              >
                {punt}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs text-paars-300">
        Deze observaties zijn door AI gegenereerd op basis van het verslag. Controleer ze altijd
        zelf — jij bepaalt welke punten meetellen en hoe zwaar.
      </p>
    </div>
  )
}
