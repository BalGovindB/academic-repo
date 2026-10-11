// Hybrid data service:
// Queries live PostgreSQL backend API (/api) when available.
// If backend is not running (e.g. static GitHub Pages demo),
// seamlessly falls back to local data/repository.ts so site never breaks.

import * as localRepo from './repository';
import { searchPapers as localSearch } from '../utils/search';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) || '';

async function fetchJson<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getOverview() {
  const data = await fetchJson<{
    metrics: { papers: number; authors: number; journals: number; publishers: number; subjects: number; citations: number };
    latest: localRepo.Paper[];
  }>('/api/overview');

  if (data) {
    return {
      metrics: data.metrics,
      latest: data.latest,
      isLivePostgres: true,
    };
  }

  // Fallback to static
  const latest = [...localRepo.papers].sort((a, b) => b.year - a.year || a.id - b.id).slice(0, 4);
  return {
    metrics: {
      papers: localRepo.papers.length,
      authors: localRepo.authors.length,
      journals: localRepo.journals.length,
      publishers: localRepo.publishers.length,
      subjects: localRepo.subjects.length,
      citations: localRepo.totalCitations,
    },
    latest,
    isLivePostgres: false,
  };
}

export async function getPapers(subject?: string) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  const data = await fetchJson<localRepo.Paper[]>(`/api/papers${query}`);
  if (data) return { papers: data, isLivePostgres: true };

  // Fallback
  const visible = localRepo.papers.filter((paper) => {
    if (!subject || subject === 'all') return true;
    if (subject === 'none') return paper.subjects.length === 0;
    return paper.subjects.some((s) => String(s.id) === subject);
  });
  return { papers: visible, isLivePostgres: false };
}

export async function getPaperDetail(id: number) {
  const data = await fetchJson<localRepo.Paper & { cites: Array<{ id: number; title: string; year: number }>; citedBy: Array<{ id: number; title: string; year: number }> }>(`/api/papers/${id}`);
  if (data) return { paper: data, isLivePostgres: true };

  // Fallback
  const paper = localRepo.paperById.get(id);
  if (!paper) return { paper: null, isLivePostgres: false };

  const cites = paper.cites.map((c) => localRepo.paperById.get(c)!).filter(Boolean);
  const citedBy = paper.citedBy.map((c) => localRepo.paperById.get(c)!).filter(Boolean);

  return {
    paper: { ...paper, cites, citedBy },
    isLivePostgres: false,
  };
}

export async function getCitationChain(id: number) {
  const data = await fetchJson<Array<{ id: number; title: string; year: number; depth: number }>>(`/api/papers/${id}/chain`);
  if (data) return { chain: data, isLivePostgres: true };

  // Fallback
  return {
    chain: localRepo.citationChain(id).map(({ paper, depth }) => ({ id: paper.id, title: paper.title, year: paper.year, depth })),
    isLivePostgres: false,
  };
}

export async function getCitationRankings() {
  const data = await fetchJson<Array<{ id: number; title: string; year: number; citations: number; rank: number; authors: Array<{ id: number; name: string }> }>>('/api/citations/rankings');
  if (data) return { rankings: data, isLivePostgres: true };

  // Fallback
  const ranking = localRepo.citationRanking()
    .filter(({ paper }) => paper.citations > 0)
    .slice(0, 10)
    .map(({ paper, rank }) => ({
      id: paper.id,
      title: paper.title,
      year: paper.year,
      citations: paper.citations,
      rank,
      authors: paper.authors,
    }));
  return { rankings: ranking, isLivePostgres: false };
}

export async function getStatistics() {
  const data = await fetchJson<{
    citationsBySubject: Array<{ name: string; citations: number }>;
    papersPerJournal: Array<{ name: string; papers: number }>;
  }>('/api/statistics');

  if (data) return { ...data, isLivePostgres: true };

  // Fallback
  return {
    citationsBySubject: localRepo.citationsBySubject(),
    papersPerJournal: localRepo.papersPerJournal(),
    isLivePostgres: false,
  };
}

export async function getAuthors() {
  const data = await fetchJson<Array<{ id: number; name: string; affiliation: string | null; paper_count: number; papers: Array<{ id: number; title: string; year: number }> }>>('/api/authors');
  if (data) return { authors: data, isLivePostgres: true };

  // Fallback
  return {
    authors: localRepo.authors.map((a) => {
      const ps = localRepo.papersOfAuthor(a.id);
      return { id: a.id, name: a.name, affiliation: a.affiliation, paper_count: ps.length, papers: ps };
    }),
    isLivePostgres: false,
  };
}

export async function getJournals() {
  const data = await fetchJson<Array<{ id: number; name: string; issn: string | null; publisher_id: number; publisher_name: string; paper_count: number; papers: Array<{ id: number; title: string; year: number }> }>>('/api/journals');
  if (data) return { journals: data, isLivePostgres: true };

  // Fallback
  return {
    journals: localRepo.journals.map((j) => {
      const ps = localRepo.papersOfJournal(j.id);
      const pub = localRepo.publishers.find((p) => p.id === j.publisherId);
      return { id: j.id, name: j.name, issn: j.issn, publisher_id: j.publisherId, publisher_name: pub?.name ?? '', paper_count: ps.length, papers: ps };
    }),
    isLivePostgres: false,
  };
}

export async function getPublishers() {
  const data = await fetchJson<Array<{ id: number; name: string; journal_count: number; paper_count: number; journals: Array<{ id: number; name: string; issn: string | null }> }>>('/api/publishers');
  if (data) return { publishers: data, isLivePostgres: true };

  // Fallback
  return {
    publishers: localRepo.publishers.map((p) => {
      const js = localRepo.journalsOfPublisher(p.id);
      const paperCount = js.reduce((sum, j) => sum + localRepo.papersOfJournal(j.id).length, 0);
      return { id: p.id, name: p.name, journal_count: js.length, paper_count: paperCount, journals: js };
    }),
    isLivePostgres: false,
  };
}

export async function getSubjects() {
  const data = await fetchJson<Array<{ id: number; name: string; paper_count: number; papers: Array<{ id: number; title: string; year: number }> }>>('/api/subjects');
  if (data) return { subjects: data, isLivePostgres: true };

  // Fallback
  return {
    subjects: localRepo.subjects.map((s) => {
      const ps = localRepo.papersOfSubject(s.id);
      return { id: s.id, name: s.name, paper_count: ps.length, papers: ps };
    }),
    isLivePostgres: false,
  };
}

export async function searchRepo(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [], isLivePostgres: false };

  const data = await fetchJson<Array<{ paper: localRepo.Paper; approximate: boolean }>>(`/api/search?q=${encodeURIComponent(trimmed)}`);
  if (data) return { hits: data, isLivePostgres: true };

  // Fallback
  return { hits: localSearch(trimmed), isLivePostgres: false };
}
