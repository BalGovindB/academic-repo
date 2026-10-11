import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, PaperCard, Title } from '../components/ui'
import { searchRepo } from '../data/api'

export default function SearchPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const [hits, setHits] = useState<Array<{ paper: any; approximate: boolean }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) {
      setHits([])
      return
    }
    setLoading(true)
    searchRepo(query).then((res) => {
      setHits(res.hits)
      setLoading(false)
    })
  }, [query])

  return (
    <>
      <Title
        title="Search"
        intro={query ? `Results for “${query}”` : 'Search by title, author, journal or subject from the navigation bar. Small typos are tolerated.'}
      />
      {loading && <p className="text-slate-600">Searching database...</p>}
      {!loading && query && (hits.length ? (
        <div className="grid gap-4">
          {hits.map(({ paper, approximate }) => (
            <PaperCard key={paper.id} paper={paper} note={approximate ? 'Approximate match (typo-tolerant pg_trgm similarity)' : undefined} />
          ))}
        </div>
      ) : (
        <Card>No matching records. Try a title word, an author, a journal or a subject.</Card>
      ))}
    </>
  )
}

