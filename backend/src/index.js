const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// 1. OVERVIEW: Counts and Latest Publications
// -------------------------------------------------------------
app.get('/api/overview', async (req, res) => {
  try {
    const countsQuery = `
      SELECT
        (SELECT count(*) FROM paper) AS papers,
        (SELECT count(*) FROM author) AS authors,
        (SELECT count(*) FROM journal) AS journals,
        (SELECT count(*) FROM publisher) AS publishers,
        (SELECT count(*) FROM subject) AS subjects,
        (SELECT count(*) FROM citation) AS citations;
    `;
    const latestQuery = `
      SELECT
        p.paper_id AS id,
        p.title,
        p.pub_year AS year,
        p.doi,
        p.abstract,
        json_build_object('id', j.journal_id, 'name', j.name, 'issn', j.issn) AS journal,
        json_build_object('id', pb.publisher_id, 'name', pb.name) AS publisher,
        coalesce(
          (SELECT json_agg(json_build_object('id', a.author_id, 'name', a.name, 'affiliation', a.affiliation) ORDER BY pa.author_order)
           FROM paper_author pa JOIN author a ON a.author_id = pa.author_id
           WHERE pa.paper_id = p.paper_id), '[]'::json
        ) AS authors,
        coalesce(
          (SELECT json_agg(json_build_object('id', s.subject_id, 'name', s.name) ORDER BY s.subject_id)
           FROM paper_subject ps JOIN subject s ON s.subject_id = ps.subject_id
           WHERE ps.paper_id = p.paper_id), '[]'::json
        ) AS subjects,
        (SELECT count(*) FROM citation c WHERE c.cited_paper_id = p.paper_id) AS citations
      FROM paper p
      JOIN journal j ON j.journal_id = p.journal_id
      JOIN publisher pb ON pb.publisher_id = j.publisher_id
      ORDER BY p.pub_year DESC, p.paper_id ASC
      LIMIT 4;
    `;

    const countsRes = await db.query(countsQuery);
    const latestRes = await db.query(latestQuery);

    res.json({
      metrics: {
        papers: parseInt(countsRes.rows[0].papers, 10),
        authors: parseInt(countsRes.rows[0].authors, 10),
        journals: parseInt(countsRes.rows[0].journals, 10),
        publishers: parseInt(countsRes.rows[0].publishers, 10),
        subjects: parseInt(countsRes.rows[0].subjects, 10),
        citations: parseInt(countsRes.rows[0].citations, 10),
      },
      latest: latestRes.rows,
    });
  } catch (err) {
    console.error('Error in /api/overview:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. PAPERS LIST (with optional subject filter, Q1, Q2, Q4)
// -------------------------------------------------------------
app.get('/api/papers', async (req, res) => {
  try {
    const { subject } = req.query;
    let params = [];
    let whereClause = '';

    if (subject !== undefined) {
      if (subject === 'none') {
        whereClause = `WHERE NOT EXISTS (SELECT 1 FROM paper_subject ps WHERE ps.paper_id = p.paper_id)`;
      } else {
        params.push(parseInt(subject, 10));
        whereClause = `WHERE EXISTS (SELECT 1 FROM paper_subject ps WHERE ps.paper_id = p.paper_id AND ps.subject_id = $1)`;
      }
    }

    const query = `
      SELECT
        p.paper_id AS id,
        p.title,
        p.pub_year AS year,
        p.doi,
        p.abstract,
        json_build_object('id', j.journal_id, 'name', j.name, 'issn', j.issn) AS journal,
        json_build_object('id', pb.publisher_id, 'name', pb.name) AS publisher,
        coalesce(
          (SELECT json_agg(json_build_object('id', a.author_id, 'name', a.name, 'affiliation', a.affiliation) ORDER BY pa.author_order)
           FROM paper_author pa JOIN author a ON a.author_id = pa.author_id
           WHERE pa.paper_id = p.paper_id), '[]'::json
        ) AS authors,
        coalesce(
          (SELECT json_agg(json_build_object('id', s.subject_id, 'name', s.name) ORDER BY s.subject_id)
           FROM paper_subject ps JOIN subject s ON s.subject_id = ps.subject_id
           WHERE ps.paper_id = p.paper_id), '[]'::json
        ) AS subjects,
        (SELECT count(*) FROM citation c WHERE c.cited_paper_id = p.paper_id) AS citations
      FROM paper p
      JOIN journal j ON j.journal_id = p.journal_id
      JOIN publisher pb ON pb.publisher_id = j.publisher_id
      ${whereClause}
      ORDER BY p.pub_year DESC, p.paper_id ASC;
    `;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/papers:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. PAPER DETAIL (single paper with cites & citedBy)
// -------------------------------------------------------------
app.get('/api/papers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const paperQuery = `
      SELECT
        p.paper_id AS id,
        p.title,
        p.pub_year AS year,
        p.doi,
        p.abstract,
        json_build_object('id', j.journal_id, 'name', j.name, 'issn', j.issn) AS journal,
        json_build_object('id', pb.publisher_id, 'name', pb.name) AS publisher,
        coalesce(
          (SELECT json_agg(json_build_object('id', a.author_id, 'name', a.name, 'affiliation', a.affiliation) ORDER BY pa.author_order)
           FROM paper_author pa JOIN author a ON a.author_id = pa.author_id
           WHERE pa.paper_id = p.paper_id), '[]'::json
        ) AS authors,
        coalesce(
          (SELECT json_agg(json_build_object('id', s.subject_id, 'name', s.name) ORDER BY s.subject_id)
           FROM paper_subject ps JOIN subject s ON s.subject_id = ps.subject_id
           WHERE ps.paper_id = p.paper_id), '[]'::json
        ) AS subjects,
        (SELECT count(*) FROM citation c WHERE c.cited_paper_id = p.paper_id) AS citations
      FROM paper p
      JOIN journal j ON j.journal_id = p.journal_id
      JOIN publisher pb ON pb.publisher_id = j.publisher_id
      WHERE p.paper_id = $1;
    `;

    const citesQuery = `
      SELECT p.paper_id AS id, p.title, p.pub_year AS year
      FROM citation c
      JOIN paper p ON p.paper_id = c.cited_paper_id
      WHERE c.citing_paper_id = $1
      ORDER BY p.pub_year DESC, p.paper_id ASC;
    `;

    const citedByQuery = `
      SELECT p.paper_id AS id, p.title, p.pub_year AS year
      FROM citation c
      JOIN paper p ON p.paper_id = c.citing_paper_id
      WHERE c.cited_paper_id = $1
      ORDER BY p.pub_year DESC, p.paper_id ASC;
    `;

    const paperRes = await db.query(paperQuery, [id]);
    if (paperRes.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const citesRes = await db.query(citesQuery, [id]);
    const citedByRes = await db.query(citedByQuery, [id]);

    const paper = paperRes.rows[0];
    paper.cites = citesRes.rows;
    paper.citedBy = citedByRes.rows;

    res.json(paper);
  } catch (err) {
    console.error('Error in /api/papers/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. CITATION CHAIN (Q16: RECURSIVE CTE)
// -------------------------------------------------------------
app.get('/api/papers/:id/chain', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const chainQuery = `
      WITH RECURSIVE chain AS (
        SELECT c.cited_paper_id AS paper_id, 1 AS depth, ARRAY[c.citing_paper_id] AS path
        FROM citation c
        WHERE c.citing_paper_id = $1

        UNION

        SELECT c.cited_paper_id, ch.depth + 1, ch.path || c.citing_paper_id
        FROM citation c
        JOIN chain ch ON ch.paper_id = c.citing_paper_id
        WHERE NOT c.cited_paper_id = ANY(ch.path)
      )
      SELECT
        p.paper_id AS id,
        p.title,
        p.pub_year AS year,
        min(ch.depth) AS depth
      FROM chain ch
      JOIN paper p ON p.paper_id = ch.paper_id
      GROUP BY p.paper_id, p.title, p.pub_year
      ORDER BY depth ASC, p.pub_year DESC, p.paper_id ASC;
    `;

    const result = await db.query(chainQuery, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/papers/:id/chain:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. CITATION RANKINGS (Q9: Window function RANK())
// -------------------------------------------------------------
app.get('/api/citations/rankings', async (req, res) => {
  try {
    const query = `
      SELECT
        p.paper_id AS id,
        p.title,
        p.pub_year AS year,
        count(c.citing_paper_id) AS citations,
        rank() OVER (ORDER BY count(c.citing_paper_id) DESC) AS rank,
        coalesce(
          (SELECT json_agg(json_build_object('id', a.author_id, 'name', a.name) ORDER BY pa.author_order)
           FROM paper_author pa JOIN author a ON a.author_id = pa.author_id
           WHERE pa.paper_id = p.paper_id), '[]'::json
        ) AS authors
      FROM paper p
      LEFT JOIN citation c ON c.cited_paper_id = p.paper_id
      GROUP BY p.paper_id, p.title, p.pub_year
      HAVING count(c.citing_paper_id) > 0
      ORDER BY citations DESC, p.paper_id ASC
      LIMIT 10;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/citations/rankings:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. DIRECTORIES (Authors, Journals, Publishers, Subjects)
// -------------------------------------------------------------
app.get('/api/authors', async (req, res) => {
  try {
    const query = `
      SELECT
        a.author_id AS id,
        a.name,
        a.affiliation,
        count(pa.paper_id) AS paper_count,
        coalesce(
          (SELECT json_agg(json_build_object('id', p.paper_id, 'title', p.title, 'year', p.pub_year) ORDER BY p.pub_year DESC)
           FROM paper_author pa2 JOIN paper p ON p.paper_id = pa2.paper_id
           WHERE pa2.author_id = a.author_id), '[]'::json
        ) AS papers
      FROM author a
      LEFT JOIN paper_author pa ON pa.author_id = a.author_id
      GROUP BY a.author_id, a.name, a.affiliation
      ORDER BY a.name ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/authors:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/journals', async (req, res) => {
  try {
    const query = `
      SELECT
        j.journal_id AS id,
        j.name,
        j.issn,
        j.publisher_id,
        pb.name AS publisher_name,
        count(p.paper_id) AS paper_count,
        coalesce(
          (SELECT json_agg(json_build_object('id', p.paper_id, 'title', p.title, 'year', p.pub_year) ORDER BY p.pub_year DESC)
           FROM paper p WHERE p.journal_id = j.journal_id), '[]'::json
        ) AS papers
      FROM journal j
      JOIN publisher pb ON pb.publisher_id = j.publisher_id
      LEFT JOIN paper p ON p.journal_id = j.journal_id
      GROUP BY j.journal_id, j.name, j.issn, j.publisher_id, pb.name
      ORDER BY j.name ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/journals:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/publishers', async (req, res) => {
  try {
    const query = `
      SELECT
        pb.publisher_id AS id,
        pb.name,
        count(DISTINCT j.journal_id) AS journal_count,
        count(p.paper_id) AS paper_count,
        coalesce(
          (SELECT json_agg(json_build_object('id', j.journal_id, 'name', j.name, 'issn', j.issn) ORDER BY j.name)
           FROM journal j WHERE j.publisher_id = pb.publisher_id), '[]'::json
        ) AS journals
      FROM publisher pb
      LEFT JOIN journal j ON j.publisher_id = pb.publisher_id
      LEFT JOIN paper p ON p.journal_id = j.journal_id
      GROUP BY pb.publisher_id, pb.name
      ORDER BY pb.name ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/publishers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subjects', async (req, res) => {
  try {
    const query = `
      SELECT
        s.subject_id AS id,
        s.name,
        count(ps.paper_id) AS paper_count,
        coalesce(
          (SELECT json_agg(json_build_object('id', p.paper_id, 'title', p.title, 'year', p.pub_year) ORDER BY p.pub_year DESC)
           FROM paper_subject ps2 JOIN paper p ON p.paper_id = ps2.paper_id
           WHERE ps2.subject_id = s.subject_id), '[]'::json
        ) AS papers
      FROM subject s
      LEFT JOIN paper_subject ps ON ps.subject_id = s.subject_id
      GROUP BY s.subject_id, s.name
      ORDER BY s.name ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/subjects:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. STATISTICS (Q5: Papers per journal, Q10: Citations per subject)
// -------------------------------------------------------------
app.get('/api/statistics', async (req, res) => {
  try {
    const citationsBySubjectQuery = `
      SELECT
        s.name,
        count(c.citing_paper_id) AS citations
      FROM subject s
      LEFT JOIN paper_subject ps ON ps.subject_id = s.subject_id
      LEFT JOIN citation c ON c.cited_paper_id = ps.paper_id
      GROUP BY s.subject_id, s.name
      ORDER BY citations DESC, s.name ASC;
    `;

    const papersPerJournalQuery = `
      SELECT
        j.name,
        count(p.paper_id) AS papers
      FROM journal j
      LEFT JOIN paper p ON p.journal_id = j.journal_id
      GROUP BY j.journal_id, j.name
      ORDER BY papers DESC, j.name ASC;
    `;

    const citationsRes = await db.query(citationsBySubjectQuery);
    const papersRes = await db.query(papersPerJournalQuery);

    res.json({
      citationsBySubject: citationsRes.rows.map(r => ({ name: r.name, citations: parseInt(r.citations, 10) })),
      papersPerJournal: papersRes.rows.map(r => ({ name: r.name, papers: parseInt(r.papers, 10) })),
    });
  } catch (err) {
    console.error('Error in /api/statistics:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. FUZZY SEARCH (Q18/Q19: Live pg_trgm trigram similarity)
// -------------------------------------------------------------
app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    // Live pg_trgm word similarity (<%) + ILIKE fallbacks across authors, journals, subjects
    const searchQuery = `
      SELECT
        p.paper_id AS id,
        p.title,
        p.pub_year AS year,
        p.doi,
        p.abstract,
        json_build_object('id', j.journal_id, 'name', j.name, 'issn', j.issn) AS journal,
        json_build_object('id', pb.publisher_id, 'name', pb.name) AS publisher,
        coalesce(
          (SELECT json_agg(json_build_object('id', a.author_id, 'name', a.name, 'affiliation', a.affiliation) ORDER BY pa.author_order)
           FROM paper_author pa JOIN author a ON a.author_id = pa.author_id
           WHERE pa.paper_id = p.paper_id), '[]'::json
        ) AS authors,
        coalesce(
          (SELECT json_agg(json_build_object('id', s.subject_id, 'name', s.name) ORDER BY s.subject_id)
           FROM paper_subject ps JOIN subject s ON s.subject_id = ps.subject_id
           WHERE ps.paper_id = p.paper_id), '[]'::json
        ) AS subjects,
        (SELECT count(*) FROM citation c WHERE c.cited_paper_id = p.paper_id) AS citations,
        CASE
          WHEN p.title ILIKE '%' || $1 || '%' THEN false
          WHEN EXISTS (SELECT 1 FROM paper_author pa JOIN author a ON a.author_id = pa.author_id WHERE pa.paper_id = p.paper_id AND a.name ILIKE '%' || $1 || '%') THEN false
          WHEN j.name ILIKE '%' || $1 || '%' THEN false
          WHEN EXISTS (SELECT 1 FROM paper_subject ps JOIN subject s ON s.subject_id = ps.subject_id WHERE ps.paper_id = p.paper_id AND s.name ILIKE '%' || $1 || '%') THEN false
          ELSE true
        END AS approximate,
        word_similarity($1, p.title) AS sim
      FROM paper p
      JOIN journal j ON j.journal_id = p.journal_id
      JOIN publisher pb ON pb.publisher_id = j.publisher_id
      WHERE
        $1 <% p.title
        OR p.title ILIKE '%' || $1 || '%'
        OR EXISTS (SELECT 1 FROM paper_author pa JOIN author a ON a.author_id = pa.author_id WHERE pa.paper_id = p.paper_id AND a.name ILIKE '%' || $1 || '%')
        OR j.name ILIKE '%' || $1 || '%'
        OR EXISTS (SELECT 1 FROM paper_subject ps JOIN subject s ON s.subject_id = ps.subject_id WHERE ps.paper_id = p.paper_id AND s.name ILIKE '%' || $1 || '%')
      ORDER BY approximate ASC, sim DESC, p.pub_year DESC, p.paper_id ASC;
    `;

    const result = await db.query(searchQuery, [q]);
    const hits = result.rows.map(row => ({
      paper: row,
      approximate: row.approximate,
    }));
    res.json(hits);
  } catch (err) {
    console.error('Error in /api/search:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Academic Repo API server running on port ${PORT}`);
});
