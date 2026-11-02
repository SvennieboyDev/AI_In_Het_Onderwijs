import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/ui'
import { StoreProvider, useStore } from './lib/store'
import Instellingen from './pages/Instellingen'
import Leerlingen from './pages/Leerlingen'
import Nakijken from './pages/Nakijken'
import Overzicht from './pages/Overzicht'
import ToetsBewerken from './pages/ToetsBewerken'
import ToetsDetail from './pages/ToetsDetail'
import Transcriptie from './pages/Transcriptie'

// Navigatie is maximaal twee lagen diep: Toetsen → Toets → (Nakijken | Transcriptie | Opzet)
function Routes_() {
  const { geladen } = useStore()
  if (!geladen) return null
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overzicht />} />
        <Route path="toets/nieuw" element={<ToetsBewerken />} />
        <Route path="toets/:toetsId" element={<ToetsDetail />} />
        <Route path="toets/:toetsId/opzet" element={<ToetsBewerken />} />
        <Route path="toets/:toetsId/nakijken/:inleveringId" element={<Nakijken />} />
        <Route path="toets/:toetsId/transcriptie/:inleveringId" element={<Transcriptie />} />
        <Route path="leerlingen" element={<Leerlingen />} />
        <Route path="instellingen" element={<Instellingen />} />
        <Route path="*" element={<div className="pagina">Deze pagina bestaat niet.</div>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes_ />
        </BrowserRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
