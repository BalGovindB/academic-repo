import { useSearchParams } from 'react-router-dom'
import { papers, subjects } from '../data/repository'
import { PaperCard, Title } from '../components/ui'

// ?subject=<id>   filter by one subject
// ?subject=none   papers that have no subject at all (classification is optional)
export default function Papers() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('subject') ?? 'all'
  const visible = papers.filter((paper) => {
    if (selected === 'all') return true
    if (selected === 'none') return paper.subjects.length === 0
    return paper.subjects.some((s) => String(s.id) === selected)
  })
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
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value="none">No subject assigned</option>
        </select>
      </label>
      <p className="mb-6 text-sm text-slate-500">Showing {visible.length} of {papers.length} papers. A paper with several subjects appears under each of them.</p>
      <div className="grid gap-4">
        {visible.map((paper) => <PaperCard key={paper.id} paper={paper} />)}
        {visible.length === 0 && <p className="text-slate-600">No papers in this research area yet.</p>}
      </div>
    </>
  )
}
