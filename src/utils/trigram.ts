// Browser-side imitation of PostgreSQL's pg_trgm similarity, used for the
// typo-tolerant search box.  The authoritative implementation is the
// database query in db/03_queries.sql (Q18, Q19); this file only lets the
// static prototype behave the same way without a database connection.
//
// pg_trgm rules reproduced here:
//   * text is lower-cased and split into words (letters and digits)
//   * each word is padded with two spaces in front and one behind
//   * the trigrams of all words form a SET
//   * similarity(a, b) = |A ∩ B| / |A ∪ B|

export function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

export function trigrams(text: string): Set<string> {
  const set = new Set<string>()
  for (const word of words(text)) {
    const padded = `  ${word} `
    for (let i = 0; i + 3 <= padded.length; i++) set.add(padded.slice(i, i + 3))
  }
  return set
}

export function similarity(a: string, b: string): number {
  const ta = trigrams(a)
  const tb = trigrams(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let common = 0
  for (const t of ta) if (tb.has(t)) common++
  return common / (ta.size + tb.size - common)
}

// pg_trgm's default threshold is 0.3 for whole strings.  The UI compares one
// query word with one text word at a time, so it uses a slightly stricter 0.35
// to avoid pulling in unrelated words ("machin" should not match "matching").
export const THRESHOLD = 0.35
