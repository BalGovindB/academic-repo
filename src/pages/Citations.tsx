import { Link } from 'react-router-dom'
import { citationRanking } from '../data/repository'
import { Card, Title } from '../components/ui'
import { pluralize } from '../utils/format'

export default function Citations() {
  const ranking = citationRanking().filter(({ paper }) => paper.citations > 0).slice(0, 10)
  return (
    <>
      <Title
        title="Citation explorer"
        intro="The ten most cited papers, counted from the citation records. Open a paper to see what it cites and who cites it."
      />
      <div className="space-y-3">
        {ranking.map(({ paper, rank }) => (
          <Card key={paper.id}>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-accent">{rank}</span>
              <div>
                <h2 className="font-serif text-xl font-bold"><Link to={`/papers/${paper.id}`} className="no-underline hover:underline">{paper.title}</Link></h2>
                <p className="mt-1 text-sm text-slate-600">{pluralize(paper.citations, 'citation')} · {paper.authors.map((a) => a.name).join(', ')}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">Papers with the same number of citations share a rank.</p>
    </>
  )
}
