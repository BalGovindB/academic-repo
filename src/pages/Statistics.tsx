import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getStatistics } from '../data/api'
import { Card, Title } from '../components/ui'

function HorizontalBars({ data, valueKey, label }: { data: Array<{ name: string } & Record<string, number | string>>; valueKey: string; label: string }) {
  return (
    <div style={{ height: Math.max(220, data.length * 38 + 40) }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={valueKey} fill="#1e3a5f" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Statistics() {
  const [stats, setStats] = useState<{
    citationsBySubject: Array<{ name: string; citations: number }>;
    papersPerJournal: Array<{ name: string; papers: number }>;
  }>({ citationsBySubject: [], papersPerJournal: [] })

  useEffect(() => {
    getStatistics().then((res) => {
      setStats({
        citationsBySubject: res.citationsBySubject,
        papersPerJournal: res.papersPerJournal,
      })
    })
  }, [])

  return (
    <>
      <Title title="Repository statistics" intro="Citation and publication activity by research area and by journal." />
      <div className="grid gap-6">
        <Card>
          <h2 className="mb-1 font-serif text-xl font-bold">Citations by subject</h2>
          <p className="mb-5 text-sm text-slate-500">Citations received by the papers of each subject. A paper with several subjects counts toward each of them.</p>
          <HorizontalBars data={stats.citationsBySubject} valueKey="citations" label="Citations received per subject" />
        </Card>
        <Card>
          <h2 className="mb-1 font-serif text-xl font-bold">Papers per journal</h2>
          <p className="mb-5 text-sm text-slate-500">Journals with no paper yet are shown with zero.</p>
          <HorizontalBars data={stats.papersPerJournal} valueKey="papers" label="Number of papers per journal" />
        </Card>
      </div>
    </>
  )
}

