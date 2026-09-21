import { CheckCircle2, FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import AiRisicoBadge from '../components/AiRisicoBadge'
import { type Inlevering, inleveringen as initieleInleveringen, rubric } from '../data/mockData'

type Filter = 'openstaand' | 'nagekeken' | 'alle'

function berekenCijfer(scores: Record<string, number>) {
  const totaal = rubric.reduce((som, c) => som + (scores[c.id] ?? 0) * c.weging, 0)
  return Math.round(totaal * 10) / 10
}

export default function Nakijken() {
  const [inleveringen, setInleveringen] = useState<Inlevering[]>(initieleInleveringen)
  const [filter, setFilter] = useState<Filter>('openstaand')
  const [zoek, setZoek] = useState('')
  const [geselecteerdId, setGeselecteerdId] = useState<string>(
    initieleInleveringen.find((i) => i.status === 'nog na te kijken')?.id ?? initieleInleveringen[0].id,
  )

  const [scores, setScores] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState('')
  const [opgeslagen, setOpgeslagen] = useState(false)

  const gefilterd = useMemo(() => {
    return inleveringen.filter((i) => {
      const matchFilter =
        filter === 'alle' ||
        (filter === 'openstaand' && i.status === 'nog na te kijken') ||
        (filter === 'nagekeken' && i.status === 'nagekeken')
      const matchZoek = i.leerling.toLowerCase().includes(zoek.toLowerCase())
      return matchFilter && matchZoek
    })
  }, [inleveringen, filter, zoek])

  const geselecteerd = inleveringen.find((i) => i.id === geselecteerdId) ?? inleveringen[0]

  function selecteer(item: Inlevering) {
    setGeselecteerdId(item.id)
    setScores(item.scores ?? {})
    setFeedback(item.feedback ?? '')
    setOpgeslagen(false)
  }

  function updateScore(criteriumId: string, waarde: number) {
    setScores((prev) => ({ ...prev, [criteriumId]: waarde }))
    setOpgeslagen(false)
  }

  const alleScoresIngevuld = rubric.every((c) => typeof scores[c.id] === 'number')
  const cijfer = alleScoresIngevuld ? berekenCijfer(scores) : null

  function opslaan() {
    if (!cijfer) return
    setInleveringen((prev) =>
      prev.map((i) =>
        i.id === geselecteerd.id
          ? { ...i, status: 'nagekeken', scores, feedback, cijfer }
          : i,
      ),
    )
    setOpgeslagen(true)
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2b1245] md:text-3xl">Nakijken</h1>
        <p className="mt-1 text-paars-500">
          Beoordeel verslagen aan de hand van de rubric. Jij houdt altijd de regie over het
          eindcijfer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* Lijst met inleveringen */}
        <div className="rounded-2xl border border-paars-100 bg-white p-4 shadow-sm shadow-paars-100/50">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-paars-100 bg-paars-50/60 px-3 py-2">
            <Search size={16} className="text-paars-400" />
            <input
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek op leerling..."
              className="w-full bg-transparent text-sm text-[#2b1245] placeholder:text-paars-300 focus:outline-none"
            />
          </div>

          <div className="mb-3 flex gap-1 rounded-xl bg-paars-50/60 p-1">
            {(
              [
                { key: 'openstaand', label: 'Open' },
                { key: 'nagekeken', label: 'Klaar' },
                { key: 'alle', label: 'Alle' },
              ] as { key: Filter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-paars-700 shadow-sm'
                    : 'text-paars-400 hover:text-paars-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto lg:max-h-[65vh]">
            {gefilterd.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-paars-300">Geen inleveringen gevonden.</p>
            )}
            {gefilterd.map((item) => (
              <button
                key={item.id}
                onClick={() => selecteer(item)}
                className={`flex flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  item.id === geselecteerd.id ? 'bg-paars-50 ring-1 ring-paars-200' : 'hover:bg-paars-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-[#2b1245]">{item.leerling}</p>
                  {item.status === 'nagekeken' && (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  )}
                </div>
                <p className="truncate text-xs text-paars-400">
                  {item.klas} · {item.woorden} woorden
                </p>
                <div className="mt-0.5">
                  <AiRisicoBadge risico={item.aiRisico} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail / nakijkpaneel */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-paars-500" />
                  <h2 className="text-lg font-semibold text-[#2b1245]">{geselecteerd.leerling}</h2>
                </div>
                <p className="text-sm text-paars-400">
                  {geselecteerd.klas} · {geselecteerd.toets} · ingeleverd {geselecteerd.ingeleverdOp} ·{' '}
                  {geselecteerd.woorden} woorden
                </p>
              </div>
              <AiRisicoBadge risico={geselecteerd.aiRisico} />
            </div>
            <div className="max-h-80 overflow-y-auto whitespace-pre-line rounded-xl bg-paars-50/50 p-4 text-sm leading-relaxed text-[#2b1245]">
              {geselecteerd.tekst}
            </div>
          </div>

          <div className="rounded-2xl border border-paars-100 bg-white p-5 shadow-sm shadow-paars-100/50">
            <h2 className="mb-4 text-lg font-semibold text-[#2b1245]">Beoordeling</h2>

            <div className="flex flex-col gap-5">
              {rubric.map((criterium) => (
                <div key={criterium.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-[#2b1245]">
                      {criterium.naam}
                      <span className="ml-2 text-xs font-normal text-paars-300">
                        weegt {Math.round(criterium.weging * 100)}%
                      </span>
                    </label>
                    <span className="w-10 text-right text-sm font-semibold text-paars-700">
                      {scores[criterium.id] ?? '–'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={scores[criterium.id] ?? 5.5}
                    onChange={(e) => updateScore(criterium.id, Number(e.target.value))}
                    className="w-full accent-paars-600"
                  />
                  <p className="mt-1 text-xs text-paars-400">{criterium.omschrijving}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-[#2b1245]">
                Feedback voor de leerling
              </label>
              <textarea
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value)
                  setOpgeslagen(false)
                }}
                rows={4}
                placeholder="Geef constructieve feedback: wat ging goed, en wat kan beter?"
                className="w-full resize-none rounded-xl border border-paars-100 bg-paars-50/40 p-3 text-sm text-[#2b1245] placeholder:text-paars-300 focus:border-paars-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-paars-100 pt-4">
              <div>
                <p className="text-xs text-paars-400">Berekend eindcijfer</p>
                <p className="text-3xl font-semibold text-[#2b1245]">
                  {cijfer ?? '–'}
                  {cijfer && <span className="text-base font-normal text-paars-300"> / 10</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {opgeslagen && (
                  <span className="text-sm font-medium text-emerald-600">Opgeslagen ✓</span>
                )}
                <button
                  onClick={opslaan}
                  disabled={!alleScoresIngevuld}
                  className="rounded-xl bg-gradient-to-r from-paars-600 to-paars-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-paars-300 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cijfer opslaan
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-paars-300">
              Het cijfer is een startpunt op basis van de rubric — jij bepaalt en past het eindoordeel
              altijd zelf aan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
