import { Sparkles } from 'lucide-react'
import type { AiFeedback } from '../data/mockData'

type Props = {
  aiFeedback: AiFeedback
  onVulAllesIn: () => void
}

export default function AiFeedbackPanel({ aiFeedback, onVulAllesIn }: Props) {
  const alineas = aiFeedback.beoordeling.split('\n\n')

  return (
    <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-paars-600 to-paars-400 text-white">
            <Sparkles size={16} />
          </div>
          <h2 className="text-lg font-semibold text-[#2b1245]">AI-beoordeling</h2>
        </div>
        <button
          onClick={onVulAllesIn}
          className="rounded-lg border border-paars-200 px-3 py-1.5 text-xs font-medium text-paars-700 hover:bg-paars-50"
        >
          Vul AI-voorstel in bij alle onderdelen
        </button>
      </div>

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-[#2b1245]">
        {alineas.map((alinea) => (
          <p key={alinea}>{alinea}</p>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-paars-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-paars-400">In het kort</p>
        <p className="mt-0.5 text-sm font-medium text-paars-900">{aiFeedback.samenvatting}</p>
      </div>
    </div>
  )
}
