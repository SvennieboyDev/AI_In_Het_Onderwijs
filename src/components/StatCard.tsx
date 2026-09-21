import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
}

export default function StatCard({ label, value, hint, icon: Icon }: Props) {
  return (
    <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-paars-400">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-paars-50 text-paars-600">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-[#2b1245]">{value}</p>
      {hint && <p className="mt-1 text-xs text-paars-400">{hint}</p>}
    </div>
  )
}
