-- =====================================================================
-- 05_trigram_demo.sql : does the pg_trgm index actually help?
-- Loads 200,000 generated papers, then compares the query plan for a fuzzy
-- title search WITHOUT and WITH the GIN trigram index.
-- Run after 01 and 02.  Exact timings depend on your machine; what matters
-- is the plan type (Seq Scan  ->  Bitmap Index Scan) and the order of
-- magnitude of "Execution Time".
-- The bulk rows are deleted again at the end (see section 5).
-- =====================================================================
\timing on

-- ---- 1. bulk load (deterministic, no randomness) --------------------
BEGIN;
WITH w AS (
    SELECT ARRAY['Scalable','Robust','Adaptive','Efficient','Sparse','Hierarchical','Probabilistic',
                 'Federated','Interpretable','Longitudinal','Comparative','Empirical','Distributed',
                 'Bayesian','Spatial','Temporal','Incremental','Multimodal'] AS adj,
           ARRAY['models','methods','frameworks','estimators','analysis','algorithms','metrics',
                 'benchmarks','surveys','architectures','protocols','indicators'] AS noun,
           ARRAY['urban planning','genomic data','climate records','language processing',
                 'public health','social networks','energy systems','clinical trials',
                 'financial markets','student learning','archival collections','traffic flow',
                 'machine learning','soil chemistry','ocean sensing','legal texts'] AS topic
), gen AS (
    INSERT INTO paper (title, pub_year, journal_id)
    SELECT CASE WHEN i % 10000 = 0 THEN 'Cryospheric ' ELSE '' END
           || w.adj[1 + (i*7)  % array_length(w.adj,1)]   || ' '
           || w.noun[1 + (i*13) % array_length(w.noun,1)] || ' for '
           || w.topic[1 + (i*11) % array_length(w.topic,1)],
           2000 + (i % 24),               -- always < 2024, never conflicts with citations
           1 + (i % 7)                    -- journals 1..7 exist
    FROM generate_series(1, 200000) AS i, w
    RETURNING paper_id
)
INSERT INTO paper_author (paper_id, author_id, author_order)
SELECT paper_id, 1 + (paper_id % 10), 1 FROM gen;   -- every paper gets one author
COMMIT;

ANALYZE paper;
SELECT count(*) AS papers_now,
       count(*) FILTER (WHERE title ILIKE 'cryospheric%') AS rare_word_rows
FROM paper;

-- ---- 2. WITHOUT the trigram index -----------------------------------
DROP INDEX IF EXISTS idx_paper_title_trgm;

\echo '=== plan WITHOUT trigram index (expect: Seq Scan on paper) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT paper_id, title
FROM paper
WHERE 'cryosperic' <% title;           -- typo for "cryospheric"

-- ---- 3. WITH the trigram index --------------------------------------
CREATE INDEX idx_paper_title_trgm ON paper USING GIN (title gin_trgm_ops);
ANALYZE paper;

\echo '=== plan WITH trigram index (expect: Bitmap Index Scan on idx_paper_title_trgm) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT paper_id, title
FROM paper
WHERE 'cryosperic' <% title;

-- ---- 4. same index also speeds up ordinary substring search ---------
\echo '=== ILIKE substring search with the index ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT paper_id, title FROM paper WHERE title ILIKE '%cryosph%';

-- ---- 5. clean up: back to the 24-paper sample data ------------------
-- (comment these two lines out if you want to keep the bulk rows)
DELETE FROM paper WHERE paper_id > 24;      -- bridge rows go via ON DELETE CASCADE
SELECT count(*) AS papers_after_cleanup FROM paper;
\timing off
