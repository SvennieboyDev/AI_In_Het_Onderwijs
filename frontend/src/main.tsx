import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { snelleInstellingen } from './lib/store'
import './styles/app.css'

// Thema en tekstgrootte meteen toepassen, zodat het scherm niet eerst licht flitst
const snel = snelleInstellingen()
const donker = snel.thema === 'donker' || (snel.thema !== 'licht' && matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.dataset.thema = donker ? 'donker' : 'licht'
if (snel.tekstgrootte) document.documentElement.style.setProperty('--tekstgrootte', String(snel.tekstgrootte))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
