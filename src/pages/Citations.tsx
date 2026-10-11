import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCitationRankings } from '../data/api'
import { Card, Title } from '../components/ui'
import { pluralize } from '../utils/format'

export default function Citations() {
  const [ranking, setRanking] = useState<any[]>([])
  useEffect(() => {
    getCitationRankings().then((res) => setRanking(res.rankings))
  }, [])

  return (
    <>
      <Title
        title="Citation explorer"
        intro="The most cited papers, counted from the citation records. Open a paper to see what it cites and who cites it."
      />
      <div className="space-y-3">
        {ranking.map((item) => (
          <Card key={item.id}>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-accent">{item.rank}</span>
              <div>
                <h2 className="font-serif text-xl font-bold">
                  <Link to={`/papers/${item.id}`} className="no-underline hover:underline">{item.title}</Link>
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {pluralize(item.citations, 'citation')} · {item.authors.map((a: any) => a.name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">Papers with the same number of citations share a rank.</p>
    </>
  )
}

