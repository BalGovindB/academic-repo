import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, PaperCard, Title } from '../components/ui'
import { searchPapers } from '../utils/search'

export default function SearchPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const hits = useMemo(() => searchPapers(query), [query])
  return (
    <>
      <Title
        title="Search"
        intro={query ? `Results for “${query}”` : 'Search by title, author, journal or subject from the navigation bar. Small typos are tolerated.'}
      />
      {query && (hits.length ? (
        <div className="grid gap-4">
          {hits.map(({ paper, approximate }) => (
            <PaperCard key={paper.id} paper={paper} note={approximate ? 'Approximate match (typo-tolerant trigram similarity)' : undefined} />
          ))}
        </div>
      ) : (
        <Card>No matching records. Try a title word, an author, a journal or a subject.</Card>
      ))}
    </>
  )
}
