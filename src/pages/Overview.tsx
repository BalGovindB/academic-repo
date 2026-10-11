import { useEffect, useState } from 'react'
import { BookOpen, Building2, Library, Network, Tag, Users, Database, type LucideIcon } from 'lucide-react'
import type { Paper } from '../data/repository'
import { getOverview } from '../data/api'
import { Card, PaperCard, Title } from '../components/ui'

export default function Overview() {
  const [data, setData] = useState<{
    metrics: { papers: number; authors: number; journals: number; publishers: number; subjects: number; citations: number };
    latest: Paper[];
    isLivePostgres: boolean;
  } | null>(null)

  useEffect(() => {
    getOverview().then(setData)
  }, [])

  if (!data) return null

  const metrics: Array<{ Icon: LucideIcon; value: number; label: string }> = [
    { Icon: BookOpen, value: data.metrics.papers, label: 'Papers' },
    { Icon: Users, value: data.metrics.authors, label: 'Authors' },
    { Icon: Library, value: data.metrics.journals, label: 'Journals' },
    { Icon: Building2, value: data.metrics.publishers, label: 'Publishers' },
    { Icon: Tag, value: data.metrics.subjects, label: 'Subjects' },
    { Icon: Network, value: data.metrics.citations, label: 'Citations' },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title title="Research, connected." intro="A living index of publications, people, venues, and the ideas linking them." />
        {data.isLivePostgres && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
            <Database size={14} /> Connected to live PostgreSQL
          </div>
        )}
      </div>
      <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(({ Icon, value, label }) => (
          <Card key={label}>
            <Icon size={20} className="text-accent" />
            <p className="mt-4 text-3xl font-semibold">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Card>
        ))}
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold">Latest publications</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.latest.map((paper) => <PaperCard key={paper.id} paper={paper} />)}
        </div>
      </section>
    </>
  )
}

