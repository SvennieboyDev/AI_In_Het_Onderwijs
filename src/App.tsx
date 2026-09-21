import { Route, Routes } from 'react-router-dom'
import Layout from './layout/Layout'
import Dashboard from './pages/Dashboard'
import Nakijken from './pages/Nakijken'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="nakijken" element={<Nakijken />} />
      </Route>
    </Routes>
  )
}

export default App
