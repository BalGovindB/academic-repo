import { papers, type Paper } from '../data/repository'
import { similarity, THRESHOLD, words } from './trigram'

export type SearchHit = { paper: Paper; score: number; approximate: boolean }

// Searches title, author names, journal name and subject names (the four
// search fields of the project).  Every word typed must be found; a word is
// found if it appears inside a word of the record (exact / partial match) or
// is trigram-similar to one (typo-tolerant match).
export function searchPapers(query: string): SearchHit[] {
  const tokens = words(query)
  if (tokens.length === 0) return []

  const hits: SearchHit[] = []
  for (const paper of papers) {
    const text = [paper.title, ...paper.authors.map((a) => a.name), paper.journal.name, ...paper.subjects.map((s) => s.name)].join(' ')
    const docWords = words(text)

    let total = 0
    let approximate = false
    let allFound = true
    for (const token of tokens) {
      let best = 0
      let exact = false
      for (const word of docWords) {
        const contains = token.length >= 3 ? word.includes(token) : word === token
        if (contains) { best = 1; exact = true; break }
        const s = similarity(token, word)
        if (s >= THRESHOLD && s > best) best = s
      }
      if (best === 0) { allFound = false; break }
      if (!exact) approximate = true
      total += best
    }
    if (allFound) hits.push({ paper, score: total / tokens.length, approximate })
  }
  return hits.sort((a, b) => b.score - a.score || b.paper.year - a.paper.year || a.paper.id - b.paper.id)
}
