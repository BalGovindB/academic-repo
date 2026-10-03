import { BookOpen, Building2, Library, Network, Tag, Users, type LucideIcon } from 'lucide-react'
import { authors, journals, papers, publishers, subjects, totalCitations } from '../data/repository'
import { Card, PaperCard, Title } from '../components/ui'

export default function Overview() {
  const metrics: Array<{ Icon: LucideIcon; value: number; label: string }> = [
    { Icon: BookOpen, value: papers.length, label: 'Papers' },
    { Icon: Users, value: authors.length, label: 'Authors' },
    { Icon: Library, value: journals.length, label: 'Journals' },
    { Icon: Building2, value: publishers.length, label: 'Publishers' },
    { Icon: Tag, value: subjects.length, label: 'Subjects' },
    { Icon: Network, value: totalCitations, label: 'Citations' },
  ]
  // newest publication year first; papers of the same year keep their id order
  const latest = [...papers].sort((a, b) => b.year - a.year || a.id - b.id).slice(0, 4)
  return (
    <>
      <Title title="Research, connected." intro="A living index of publications, people, venues, and the ideas linking them." />
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
          {latest.map((paper) => <PaperCard key={paper.id} paper={paper} />)}
        </div>
      </section>
    </>
  )
}
