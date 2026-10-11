import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { subjects } from '../data/repository'
import { getPapers } from '../data/api'
import type { Paper } from '../data/repository'
import { PaperCard, Title } from '../components/ui'

// ?subject=<id>   filter by one subject
// ?subject=none   papers that have no subject at all (classification is optional)
export default function Papers() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('subject') ?? 'all'
  const [papersList, setPapersList] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPapers(selected).then(({ papers }) => {
      setPapersList(papers)
      setLoading(false)
    })
  }, [selected])

  return (
    <>
      <Title title="Papers" intro="Browse the collection and filter it by research area." />
      <label className="mb-2 block max-w-xs text-sm font-medium">
        Research area
        <select
          value={selected}
          onChange={(e) => setParams(e.target.value === 'all' ? {} : { subject: e.target.value })}
          className="mt-1 w-full rounded-md border border-stone-300 bg-white p-2"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          <option value="none">No subject assigned</option>
        </select>
      </label>
      <p className="mb-6 text-sm text-slate-500">
        {loading ? 'Loading papers...' : `Showing ${papersList.length} papers. A paper with several subjects appears under each of them.`}
      </p>
      <div className="grid gap-4">
        {papersList.map((paper) => <PaperCard key={paper.id} paper={paper} />)}
        {!loading && papersList.length === 0 && <p className="text-slate-600">No papers in this research area yet.</p>}
      </div>
    </>
  )
}

