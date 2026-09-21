import { Sparkles } from 'lucide-react'
import type { AiRisico } from '../data/mockData'

const styles: Record<AiRisico, string> = {
  laag: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  gemiddeld: 'bg-amber-50 text-amber-700 ring-amber-200',
  hoog: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const labels: Record<AiRisico, string> = {
  laag: 'Laag AI-risico',
  gemiddeld: 'Gemiddeld AI-risico',
  hoog: 'Hoog AI-risico',
}

export default function AiRisicoBadge({ risico }: { risico: AiRisico }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[risico]}`}
      title="Indicatieve inschatting — geen definitief oordeel. Eindbeslissing ligt bij de docent."
    >
      <Sparkles size={12} />
      {labels[risico]}
    </span>
  )
}
