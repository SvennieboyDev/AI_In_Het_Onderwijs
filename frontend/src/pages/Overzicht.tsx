import { Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui'
import { bepaalStatus } from '../lib/nakijken'
import { useStore } from '../lib/store'
import { maakVoorbeeld } from '../lib/voorbeeld'

export default function Overzicht() {
  const { toetsen, inleveringen, leerlingen, voegToetsToe, voegInleveringenToe, zetLeerlingen } = useStore()
  const navigeer = useNavigate()
  const toast = useToast()

  function laadVoorbeeld() {
    const voorbeeld = maakVoorbeeld(leerlingen.map((l) => l.code))
    voegToetsToe(voorbeeld.toets)
    voegInleveringenToe(voorbeeld.inleveringen)
    zetLeerlingen([...leerlingen, ...voorbeeld.leerlingen])
    toast('Voorbeeldtoets geladen')
    navigeer(`/toets/${voorbeeld.toets.id}`)
  }

  const gesorteerd = [...toetsen].sort((a, b) => b.aangemaaktOp.localeCompare(a.aangemaaktOp))

  return (
    <div className="pagina">
      <div className="pagina-kop">
        <div>
          <h1>Toetsen</h1>
          <p className="zacht">Kies een toets om werk toe te voegen of verder na te kijken.</p>
        </div>
        <Link to="/toets/nieuw" className="knop knop-primair">
          <Plus size={18} aria-hidden /> Nieuwe toets
        </Link>
      </div>

      {gesorteerd.length === 0 ? (
        <div className="leeg">
          <h2>Nog geen toetsen</h2>
          <p>Maak een toets aan met de opdracht en de rubric. Daarna voeg je het werk van je leerlingen toe.</p>
          <div className="rij">
            <Link to="/toets/nieuw" className="knop knop-primair">
              Nieuwe toets
            </Link>
            <button className="knop" onClick={laadVoorbeeld}>
              Voorbeeldtoets laden
            </button>
          </div>
        </div>
      ) : (
        <div>
          {gesorteerd.map((toets) => {
            const werk = inleveringen.filter((i) => i.toetsId === toets.id)
            const statussen = werk.map((i) => bepaalStatus(i, toets).code)
            const klaar = statussen.filter((s) => s === 'vastgesteld').length
            const docent = statussen.filter((s) => s === 'docent').length
            const transcriptie = statussen.filter((s) => s === 'transcriptie').length
            return (
              <Link key={toets.id} to={`/toets/${toets.id}`} className="toetsrij">
                <div>
                  <h2>{toets.titel}</h2>
                  <p className="zacht klein">
                    {[toets.klas, toets.vak, `${werk.length} ${werk.length === 1 ? 'leerling' : 'leerlingen'}`].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="klein" style={{ display: 'grid', gap: '0.2rem', justifyItems: 'end' }}>
                  {transcriptie > 0 && <span className="status status-info">{transcriptie} transcriptie te controleren</span>}
                  {docent > 0 && <span className="status status-let-op">{docent} docent moet beoordelen</span>}
                </div>
                <div className="voortgang">
                  <span className="cijfers">
                    {klaar} van {werk.length} vastgesteld
                  </span>
                  <div className="voortgang-balk" aria-hidden>
                    <div style={{ width: `${werk.length ? (klaar / werk.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </Link>
            )
          })}
          {!toetsen.some((t) => t.titel.includes('(voorbeeld)')) && (
            <p className="klein zacht" style={{ marginTop: '1.5rem' }}>
              Wil je de tool eerst verkennen?{' '}
              <button className="knop-stil knop knop-klein" onClick={laadVoorbeeld}>
                Voorbeeldtoets laden
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
