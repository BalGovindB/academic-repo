import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPaperDetail, getCitationChain } from '../data/api'
import type { Paper } from '../data/repository'
import { Card, PaperLinks, Title } from '../components/ui'
import { pluralize } from '../utils/format'

export default function PaperDetail() {
  const { id } = useParams()
  const paperId = Number(id)
  const [paper, setPaper] = useState<(Paper & { cites: any[]; citedBy: any[] }) | null>(null)
  const [chain, setChain] = useState<Array<{ id: number; title: string; year: number; depth: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getPaperDetail(paperId), getCitationChain(paperId)]).then(([pRes, cRes]) => {
      setPaper(pRes.paper as any)
      setChain(cRes.chain)
      setLoading(false)
    })
  }, [paperId])

  if (loading) return <p className="text-slate-600">Loading paper details...</p>

  if (!paper) {
    return (
      <>
        <Title title="Paper not found" intro="There is no paper with this identifier in the repository." />
        <Link to="/papers">Back to all papers</Link>
      </>
    )
  }


  return (
    <>
      <p className="mb-4 text-sm"><Link to="/papers">← All papers</Link></p>
      <Title title={paper.title} intro={`${paper.year} · ${paper.journal.name}`} />

      <Card>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-slate-500">Journal</dt><dd>{paper.journal.name}{paper.journal.issn ? ` (ISSN ${paper.journal.issn})` : ''}</dd></div>
          <div><dt className="font-semibold text-slate-500">Publisher</dt><dd>{paper.publisher.name}</dd></div>
          <div><dt className="font-semibold text-slate-500">Year</dt><dd>{paper.year}</dd></div>
          <div><dt className="font-semibold text-slate-500">DOI</dt><dd>{paper.doi ?? 'Not recorded'}</dd></div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-500">Authors (in order)</dt>
            <dd>
              <ol className="list-inside list-decimal">
                {paper.authors.map((a) => <li key={a.id}>{a.name}{a.affiliation ? ` — ${a.affiliation}` : ''}</li>)}
              </ol>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-500">Subjects</dt>
            <dd>
              {paper.subjects.length === 0 && 'None assigned'}
              {paper.subjects.map((s, i) => (
                <span key={s.id}>{i > 0 && ', '}<Link to={`/papers?subject=${s.id}`}>{s.name}</Link></span>
              ))}
            </dd>
          </div>
          {paper.abstract && <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Abstract</dt><dd className="leading-6">{paper.abstract}</dd></div>}
        </dl>
      </Card>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl font-bold">Cites ({paper.cites.length})</h2>
          <PaperLinks list={paper.cites} empty="This paper cites no other paper in the repository." />
        </Card>
        <Card>
          <h2 className="font-serif text-xl font-bold">Cited by ({pluralize(paper.citedBy.length, 'paper')})</h2>
          <PaperLinks list={paper.citedBy} empty="No paper in the repository cites this one yet." />
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <h2 className="font-serif text-xl font-bold">Citation chain</h2>
          <p className="mt-1 text-sm text-slate-600">
            Every paper reachable by following “cites” links, with the number of steps (the recursive citation query of the database, Q16).
          </p>
          {chain.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing to follow: this paper cites no other paper.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {chain.map((item) => (
                <li key={item.id} style={{ paddingLeft: `${(item.depth - 1) * 20}px` }}>
                  <span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">step {item.depth}</span>
                  <Link to={`/papers/${item.id}`}>{item.title}</Link> <span className="text-slate-500">({item.year})</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  )
}
