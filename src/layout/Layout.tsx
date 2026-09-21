import { GraduationCap, LayoutDashboard, PenLine, Settings, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/nakijken', label: 'Nakijken', icon: PenLine, end: false },
]

const binnenkortItems = [
  { label: 'Klassen', icon: Users },
  { label: 'Instellingen', icon: Settings },
]

export default function Layout() {
  return (
    <div className="flex min-h-svh bg-gradient-to-br from-paars-50 via-white to-paars-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-paars-100 bg-white/70 px-4 py-6 backdrop-blur-sm md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-paars-600 to-paars-400 text-white shadow-sm shadow-paars-300">
            <GraduationCap size={20} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-paars-900">NakijkAssistent</p>
            <p className="text-xs text-paars-400">Helen Parkhurst</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-paars-300">
            Overzicht
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-paars-600 to-paars-500 text-white shadow-sm shadow-paars-300'
                    : 'text-paars-800/80 hover:bg-paars-50'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          <p className="mt-6 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-paars-300">
            Binnenkort
          </p>
          {binnenkortItems.map((item) => (
            <div
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-paars-300"
              title="Nog niet beschikbaar in dit prototype"
            >
              <item.icon size={18} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="mt-auto rounded-xl bg-paars-50 p-3 text-xs text-paars-500">
          Prototype — geen inlog vereist. Gegevens zijn voorbeelddata.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-paars-100 bg-white/60 px-4 py-3 backdrop-blur-sm md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-paars-600 to-paars-400 text-white">
              <GraduationCap size={16} />
            </div>
            <p className="text-sm font-semibold text-paars-900">NakijkAssistent</p>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-paars-400">Welkom terug</p>
            <p className="text-lg font-semibold text-paars-900">Mevrouw Jansen — Nederlands</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-paars-500 to-paars-700 text-sm font-semibold text-white">
            MJ
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>

        <nav className="flex items-center justify-around border-t border-paars-100 bg-white/80 py-2 backdrop-blur-sm md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium ${
                  isActive ? 'text-paars-700' : 'text-paars-300'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
