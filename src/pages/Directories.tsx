import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuthors, getJournals, getPublishers, getSubjects } from '../data/api'
import { Card, PaperLinks, Title } from '../components/ui'
import { pluralize } from '../utils/format'

const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function AuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([])
  useEffect(() => { getAuthors().then((res) => setAuthors(res.authors)) }, [])

  return (
    <>
      <Title title="Authors" intro="A quick directory of authors represented in this repository." />
      <div className={grid}>
        {authors.map((a) => (
          <Card key={a.id}>
            <h2 className="font-serif text-xl font-bold">{a.name}</h2>
            <p className="text-sm text-slate-500">{a.affiliation ?? 'Affiliation not recorded'}</p>
            <p className="mt-2 text-sm text-slate-600">{pluralize(a.paper_count, 'publication')}</p>
            <PaperLinks list={a.papers} empty="No papers recorded yet." />
          </Card>
        ))}
      </div>
    </>
  )
}

export function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([])
  useEffect(() => { getJournals().then((res) => setJournals(res.journals)) }, [])

  return (
    <>
      <Title title="Journals" intro="A quick directory of journals represented in this repository." />
      <div className={grid}>
        {journals.map((j) => (
          <Card key={j.id}>
            <h2 className="font-serif text-xl font-bold">{j.name}</h2>
            <p className="text-sm text-slate-500">{j.publisher_name}{j.issn ? ` · ISSN ${j.issn}` : ''}</p>
            <p className="mt-2 text-sm text-slate-600">{pluralize(j.paper_count, 'publication')}</p>
            <PaperLinks list={j.papers} empty="No papers recorded yet." />
          </Card>
        ))}
      </div>
    </>
  )
}

export function PublishersPage() {
  const [publishers, setPublishers] = useState<any[]>([])
  useEffect(() => { getPublishers().then((res) => setPublishers(res.publishers)) }, [])

  return (
    <>
      <Title title="Publishers" intro="Organisations that issue the journals in this repository." />
      <div className={grid}>
        {publishers.map((p) => (
          <Card key={p.id}>
            <h2 className="font-serif text-xl font-bold">{p.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{pluralize(p.journal_count, 'journal')} · {pluralize(p.paper_count, 'publication')}</p>
            {p.journal_count === 0
              ? <p className="mt-2 text-sm text-slate-500">Issues no journal yet.</p>
              : <ul className="mt-2 list-inside list-disc text-sm">{p.journals.map((j: any) => <li key={j.id}>{j.name}</li>)}</ul>}
          </Card>
        ))}
      </div>
    </>
  )
}

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  useEffect(() => { getSubjects().then((res) => setSubjects(res.subjects)) }, [])

  return (
    <>
      <Title title="Subjects" intro="A quick directory of subjects represented in this repository." />
      <div className={grid}>
        {subjects.map((s) => (
          <Card key={s.id}>
            <h2 className="font-serif text-xl font-bold">{s.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{pluralize(s.paper_count, 'publication')}</p>
            {s.paper_count > 0 ? (
              <p className="mt-2 text-sm"><Link to={`/papers?subject=${s.id}`}>Browse these papers</Link></p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No papers classified yet.</p>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
