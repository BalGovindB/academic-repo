import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Paper } from '../data/repository'
import { pluralize } from '../utils/format'

export function Title({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{intro}</p>
    </div>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">{children}</article>
}

export function PaperCard({ paper, note }: { paper: Paper; note?: string }) {
  const subjectLabel = paper.subjects.length ? paper.subjects.map((s) => s.name).join(' · ') : 'Unclassified'
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{subjectLabel} · {paper.year}</p>
          <h3 className="mt-1 font-serif text-xl font-bold">
            <Link to={`/papers/${paper.id}`} className="no-underline hover:underline">{paper.title}</Link>
          </h3>
        </div>
        <span className="whitespace-nowrap text-sm text-slate-500">{pluralize(paper.citations, 'citation')}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {paper.authors.map((a) => a.name).join(', ')} · <em>{paper.journal.name}</em>
      </p>
      {paper.abstract && <p className="mt-3 text-sm leading-6 text-slate-600">{paper.abstract}</p>}
      {note && <p className="mt-3 inline-block rounded bg-stone-100 px-2 py-1 text-xs text-slate-600">{note}</p>}
    </Card>
  )
}

// A compact, linked list of papers (used inside directory cards and on the paper page).
export function PaperLinks({ list, empty }: { list: Paper[]; empty: string }) {
  if (list.length === 0) return <p className="mt-2 text-sm text-slate-500">{empty}</p>
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {list.map((p) => (
        <li key={p.id}>
          <Link to={`/papers/${p.id}`}>{p.title}</Link> <span className="text-slate-500">({p.year})</span>
        </li>
      ))}
    </ul>
  )
}
