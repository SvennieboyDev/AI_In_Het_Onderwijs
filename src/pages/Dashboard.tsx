import { AlarmClock, CheckCircle2, Clock, FileStack, PenLine, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import AiRisicoBadge from '../components/AiRisicoBadge'
import StatCard from '../components/StatCard'
import { inleveringen, klassen } from '../data/mockData'

export default function Dashboard() {
  const totaal = inleveringen.length
  const nagekeken = inleveringen.filter((i) => i.status === 'nagekeken').length
  const openstaand = totaal - nagekeken
  const hoogRisico = inleveringen.filter((i) => i.aiRisico === 'hoog').length

  const teBeoordelen = inleveringen.filter((i) => i.status === 'nog na te kijken').slice(0, 4)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#2b1245] md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-paars-500">
          Een overzicht van je nakijkwerk voor Nederlands. Alles wat je nodig hebt, op één plek.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Nog na te kijken" value={String(openstaand)} icon={Clock} hint="Verslagen in de wachtrij" />
        <StatCard label="Nagekeken" value={String(nagekeken)} icon={CheckCircle2} hint="Deze week afgerond" />
        <StatCard label="Totaal ingeleverd" value={String(totaal)} icon={FileStack} hint="Alle klassen samen" />
        <StatCard label="Hoog AI-risico" value={String(hoogRisico)} icon={Sparkles} hint="Verdient extra aandacht" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2b1245]">Wacht op jouw beoordeling</h2>
              <p className="text-sm text-paars-400">De vier meest recente inleveringen</p>
            </div>
            <Link
              to="/nakijken"
              className="text-sm font-medium text-paars-600 hover:text-paars-800"
            >
              Naar nakijksysteem →
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-paars-100">
            {teBeoordelen.map((item) => (
              <Link
                key={item.id}
                to="/nakijken"
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#2b1245]">{item.leerling}</p>
                  <p className="truncate text-sm text-paars-400">
                    {item.klas} · {item.toets}
                  </p>
                </div>
                <AiRisicoBadge risico={item.aiRisico} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50">
          <h2 className="mb-4 text-lg font-semibold text-[#2b1245]">Voortgang per klas</h2>
          <div className="flex flex-col gap-4">
            {klassen.map((klas) => {
              const pct = klas.opengezet === 0 ? 0 : Math.round((klas.nagekeken / klas.opengezet) * 100)
              return (
                <div key={klas.naam}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#2b1245]">{klas.naam}</span>
                    <span className="text-paars-400">
                      {klas.opengezet === 0 ? 'Nog niet gestart' : `${klas.nagekeken}/${klas.opengezet}`}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-paars-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-paars-600 to-paars-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/nakijken"
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-paars-600 to-paars-500 p-5 text-white shadow-sm shadow-paars-300 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <PenLine size={22} />
          </div>
          <div>
            <p className="font-semibold">Start met nakijken</p>
            <p className="text-sm text-white/80">Ga direct naar de openstaande verslagen</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-paars-200 bg-white/60 p-5 text-paars-500">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-paars-50 text-paars-500">
            <AlarmClock size={22} />
          </div>
          <div>
            <p className="font-semibold text-paars-700">Bestanden uploaden</p>
            <p className="text-sm">Binnenkort beschikbaar in een volgende versie van dit prototype</p>
          </div>
        </div>
      </div>
    </div>
  )
}
