import { Link } from 'react-router-dom'
import {
  authors, journals, journalsOfPublisher, papersOfAuthor, papersOfJournal, papersOfSubject, publishers, subjects,
} from '../data/repository'
import { Card, PaperLinks, Title } from '../components/ui'
import { pluralize } from '../utils/format'

const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function AuthorsPage() {
  return (
    <>
      <Title title="Authors" intro="A quick directory of authors represented in this repository." />
      <div className={grid}>
        {authors.map((a) => {
          const list = papersOfAuthor(a.id)
          return (
            <Card key={a.id}>
              <h2 className="font-serif text-xl font-bold">{a.name}</h2>
              <p className="text-sm text-slate-500">{a.affiliation ?? 'Affiliation not recorded'}</p>
              <p className="mt-2 text-sm text-slate-600">{pluralize(list.length, 'publication')}</p>
              <PaperLinks list={list} empty="No papers recorded yet." />
            </Card>
          )
        })}
      </div>
    </>
  )
}

export function JournalsPage() {
  return (
    <>
      <Title title="Journals" intro="A quick directory of journals represented in this repository." />
      <div className={grid}>
        {journals.map((j) => {
          const list = papersOfJournal(j.id)
          const publisher = publishers.find((p) => p.id === j.publisherId)
          return (
            <Card key={j.id}>
              <h2 className="font-serif text-xl font-bold">{j.name}</h2>
              <p className="text-sm text-slate-500">{publisher?.name}{j.issn ? ` · ISSN ${j.issn}` : ''}</p>
              <p className="mt-2 text-sm text-slate-600">{pluralize(list.length, 'publication')}</p>
              <PaperLinks list={list} empty="No papers recorded yet." />
            </Card>
          )
        })}
      </div>
    </>
  )
}

export function PublishersPage() {
  return (
    <>
      <Title title="Publishers" intro="Organisations that issue the journals in this repository." />
      <div className={grid}>
        {publishers.map((p) => {
          const js = journalsOfPublisher(p.id)
          const paperCount = js.reduce((sum, j) => sum + papersOfJournal(j.id).length, 0)
          return (
            <Card key={p.id}>
              <h2 className="font-serif text-xl font-bold">{p.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{pluralize(js.length, 'journal')} · {pluralize(paperCount, 'publication')}</p>
              {js.length === 0
                ? <p className="mt-2 text-sm text-slate-500">Issues no journal yet.</p>
                : <ul className="mt-2 list-inside list-disc text-sm">{js.map((j) => <li key={j.id}>{j.name} ({papersOfJournal(j.id).length})</li>)}</ul>}
            </Card>
          )
        })}
      </div>
    </>
  )
}

export function SubjectsPage() {
  return (
    <>
      <Title title="Subjects" intro="A quick directory of subjects represented in this repository." />
      <div className={grid}>
        {subjects.map((s) => {
          const count = papersOfSubject(s.id).length
          return (
            <Card key={s.id}>
              <h2 className="font-serif text-xl font-bold">{s.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{pluralize(count, 'publication')}</p>
              {count > 0 ? <p className="mt-2 text-sm"><Link to={`/papers?subject=${s.id}`}>Browse these papers</Link></p> : <p className="mt-2 text-sm text-slate-500">No papers classified yet.</p>}
            </Card>
          )
        })}
      </div>
    </>
  )
}
