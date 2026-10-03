import type { ReactNode } from 'react'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import Overview from './pages/Overview'
import Papers from './pages/Papers'
import PaperDetail from './pages/PaperDetail'
import { AuthorsPage, JournalsPage, PublishersPage, SubjectsPage } from './pages/Directories'
import SearchPage from './pages/SearchPage'
import Citations from './pages/Citations'
import Statistics from './pages/Statistics'

const navItems: Array<[string, string]> = [
  ['/papers', 'Papers'],
  ['/authors', 'Authors'],
  ['/journals', 'Journals'],
  ['/publishers', 'Publishers'],
  ['/subjects', 'Subjects'],
  ['/citations', 'Citations'],
  ['/statistics', 'Statistics'],
]

function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="font-serif text-lg font-bold text-slate-900 no-underline">Academic Repository</NavLink>
          <form onSubmit={submit} className="order-3 flex w-full items-center rounded-md border border-stone-300 bg-stone-50 px-3 py-2 sm:order-none sm:ml-auto sm:w-72">
            <Search size={16} className="mr-2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search research" aria-label="Search research" className="w-full bg-transparent text-sm outline-none" />
          </form>
          <nav className="order-4 flex w-full gap-4 overflow-x-auto text-sm sm:order-none sm:w-auto">
            {navItems.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap no-underline ${isActive ? 'font-semibold text-accent' : 'text-slate-600 hover:text-slate-900'}`}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6">
          <p>Prototype interface: sample data exported from the project's PostgreSQL database (see the <code>db</code> folder). The pages do not query the database at run time.</p>
          <p className="mt-1">Built with React, TypeScript, Tailwind CSS, React Router, Recharts, and Lucide.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/papers/:id" element={<PaperDetail />} />
        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/journals" element={<JournalsPage />} />
        <Route path="/publishers" element={<PublishersPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/citations" element={<Citations />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<Overview />} />
      </Routes>
    </Layout>
  )
}
