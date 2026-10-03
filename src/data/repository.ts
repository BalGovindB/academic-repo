// Data layer of the prototype.
//
// repository.json is GENERATED from the PostgreSQL database by
// scripts/export-ui-data.sh (query: db/06_export_ui_data.sql).  It holds the
// rows of the tables exactly as they are stored; everything else on this page
// (citation counts, rankings, per-subject totals, citation chains) is
// computed here from those rows, just as the SQL queries compute it.
import raw from './repository.json'

export type Publisher = { id: number; name: string }
export type Journal = { id: number; name: string; issn: string | null; publisherId: number }
export type Author = { id: number; name: string; affiliation: string | null }
export type Subject = { id: number; name: string }

type RawPaper = {
  id: number
  title: string
  year: number
  doi: string | null
  abstract: string | null
  journalId: number
  authorIds: number[] // ordered by author_order
  subjectIds: number[]
  cites: number[] // rows of CITATION where this paper is the citing paper
  citedBy: number[] // rows of CITATION where this paper is the cited paper
}
type RawData = {
  publishers: Publisher[]
  journals: Journal[]
  authors: Author[]
  subjects: Subject[]
  papers: RawPaper[]
}

const data = raw as unknown as RawData

export type Paper = {
  id: number
  title: string
  year: number
  doi: string | null
  abstract: string | null
  journal: Journal
  publisher: Publisher
  authors: Author[] // in author_order
  subjects: Subject[]
  cites: number[]
  citedBy: number[]
  citations: number // = number of CITATION rows pointing at this paper
}

export const publishers = data.publishers
export const journals = data.journals
export const authors = data.authors
export const subjects = data.subjects

const publisherById = new Map(publishers.map((x) => [x.id, x]))
const journalById = new Map(journals.map((x) => [x.id, x]))
const authorById = new Map(authors.map((x) => [x.id, x]))
const subjectById = new Map(subjects.map((x) => [x.id, x]))

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Broken reference in repository.json: ${what}`)
  return value
}

export const papers: Paper[] = data.papers.map((p) => {
  const journal = need(journalById.get(p.journalId), `journal ${p.journalId}`)
  return {
    id: p.id,
    title: p.title,
    year: p.year,
    doi: p.doi,
    abstract: p.abstract,
    journal,
    publisher: need(publisherById.get(journal.publisherId), `publisher ${journal.publisherId}`),
    authors: p.authorIds.map((id) => need(authorById.get(id), `author ${id}`)),
    subjects: p.subjectIds.map((id) => need(subjectById.get(id), `subject ${id}`)),
    cites: p.cites,
    citedBy: p.citedBy,
    citations: p.citedBy.length,
  }
})

export const paperById = new Map(papers.map((p) => [p.id, p]))

// Total rows of the CITATION table.
export const totalCitations = papers.reduce((sum, p) => sum + p.cites.length, 0)

// ---- derived views (each mirrors a query in db/03_queries.sql) -----------

// Q4 / Q3: papers of a subject / of an author
export const papersOfSubject = (subjectId: number) => papers.filter((p) => p.subjects.some((s) => s.id === subjectId))
export const papersOfAuthor = (authorId: number) => papers.filter((p) => p.authors.some((a) => a.id === authorId))

// Q7: journals of a publisher and their papers
export const journalsOfPublisher = (publisherId: number) => journals.filter((j) => j.publisherId === publisherId)
export const papersOfJournal = (journalId: number) => papers.filter((p) => p.journal.id === journalId)

// Q10: citations received per subject (a paper with two subjects counts for both)
export function citationsBySubject() {
  return subjects.map((s) => ({
    name: s.name,
    citations: papersOfSubject(s.id).reduce((sum, p) => sum + p.citations, 0),
  }))
}

// Q5: papers per journal, including journals with none
export function papersPerJournal() {
  return journals.map((j) => ({ name: j.name, papers: papersOfJournal(j.id).length }))
}

// Q9: ranking by citations with ties sharing a rank (SQL RANK())
export function citationRanking() {
  const sorted = [...papers].sort((a, b) => b.citations - a.citations || a.id - b.id)
  return sorted.map((paper) => ({ paper, rank: 1 + sorted.filter((q) => q.citations > paper.citations).length }))
}

// Q16: everything a paper cites, directly or indirectly, with the shortest
// number of "cites" steps (breadth-first search; the visited set is the cycle
// guard).  Same result as the recursive CTE in the SQL script.
export function citationChain(paperId: number): Array<{ paper: Paper; depth: number }> {
  const seen = new Set<number>([paperId])
  const result: Array<{ paper: Paper; depth: number }> = []
  let frontier = [paperId]
  for (let depth = 1; frontier.length > 0; depth++) {
    const next: number[] = []
    for (const id of frontier) {
      for (const cited of paperById.get(id)?.cites ?? []) {
        if (seen.has(cited)) continue
        seen.add(cited)
        next.push(cited)
        result.push({ paper: need(paperById.get(cited), `paper ${cited}`), depth })
      }
    }
    frontier = next
  }
  return result.sort((a, b) => a.depth - b.depth || a.paper.id - b.paper.id)
}
