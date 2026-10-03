-- =====================================================================
-- 03_queries.sql : demonstration queries (run after 01 and 02)
-- Each block says WHAT it shows.  Usage: psql -d <db> -f 03_queries.sql
-- =====================================================================

\echo '--- Q1  JOIN (3 tables): paper -> journal -> publisher'
SELECT p.paper_id, p.title, p.pub_year, j.name AS journal, pb.name AS publisher
FROM paper p
JOIN journal   j  ON j.journal_id   = p.journal_id
JOIN publisher pb ON pb.publisher_id = j.publisher_id
ORDER BY p.paper_id
LIMIT 10;

\echo '--- Q2  M:N via bridge table: authors of each paper in author_order'
SELECT p.paper_id, p.title,
       string_agg(a.name, ', ' ORDER BY pa.author_order) AS authors
FROM paper p
JOIN paper_author pa ON pa.paper_id  = p.paper_id
JOIN author a        ON a.author_id  = pa.author_id
GROUP BY p.paper_id, p.title
ORDER BY p.paper_id
LIMIT 10;

\echo '--- Q3  Search by author name (UI: author search)'
SELECT p.paper_id, p.title, p.pub_year, pa.author_order
FROM author a
JOIN paper_author pa ON pa.author_id = a.author_id
JOIN paper p         ON p.paper_id   = pa.paper_id
WHERE a.name = 'Maya Chen'
ORDER BY p.pub_year DESC, p.paper_id;

\echo '--- Q4  Filter by subject (UI: subject filter)'
SELECT p.paper_id, p.title, p.pub_year
FROM subject s
JOIN paper_subject ps ON ps.subject_id = s.subject_id
JOIN paper p          ON p.paper_id    = ps.paper_id
WHERE s.name = 'Data Science'
ORDER BY p.pub_year DESC, p.paper_id;

\echo '--- Q5  Journal metrics: papers per journal, INCLUDING journals with none (LEFT JOIN + GROUP BY)'
SELECT j.journal_id, j.name, count(p.paper_id) AS papers
FROM journal j
LEFT JOIN paper p ON p.journal_id = j.journal_id
GROUP BY j.journal_id, j.name
ORDER BY papers DESC, j.journal_id;

\echo '--- Q6  HAVING: journals with at least 3 papers'
SELECT j.name, count(*) AS papers
FROM journal j JOIN paper p ON p.journal_id = j.journal_id
GROUP BY j.journal_id, j.name
HAVING count(*) >= 3
ORDER BY papers DESC, j.name;

\echo '--- Q7  Publisher -> journals -> papers (two LEFT JOINs; publisher with no journal still listed)'
SELECT pb.name AS publisher,
       count(DISTINCT j.journal_id) AS journals,
       count(p.paper_id)            AS papers
FROM publisher pb
LEFT JOIN journal j ON j.publisher_id = pb.publisher_id
LEFT JOIN paper   p ON p.journal_id   = j.journal_id
GROUP BY pb.publisher_id, pb.name
ORDER BY papers DESC, pb.name;

\echo '--- Q8  Citation count per paper, computed (never stored): AGGREGATION'
SELECT p.paper_id, p.title, count(c.citing_paper_id) AS times_cited
FROM paper p
LEFT JOIN citation c ON c.cited_paper_id = p.paper_id
GROUP BY p.paper_id, p.title
ORDER BY times_cited DESC, p.paper_id
LIMIT 10;

\echo '--- Q9  Citation RANKING with ties handled (window function RANK)'
SELECT rank() OVER (ORDER BY n DESC) AS rnk, paper_id, title, n AS times_cited
FROM (
    SELECT p.paper_id, p.title, count(c.citing_paper_id) AS n
    FROM paper p LEFT JOIN citation c ON c.cited_paper_id = p.paper_id
    GROUP BY p.paper_id, p.title
) t
ORDER BY rnk, paper_id
LIMIT 10;

\echo '--- Q10 Citations received per subject (UI: citation-by-subject chart)'
-- A paper with two subjects counts toward both of them.
SELECT s.name AS subject, count(c.citing_paper_id) AS citations_received
FROM subject s
LEFT JOIN paper_subject ps ON ps.subject_id = s.subject_id
LEFT JOIN citation c       ON c.cited_paper_id = ps.paper_id
GROUP BY s.subject_id, s.name
ORDER BY citations_received DESC, s.name;

\echo '--- Q11 Subquery in HAVING: papers cited more than the average paper'
SELECT p.paper_id, p.title, count(*) AS times_cited
FROM paper p JOIN citation c ON c.cited_paper_id = p.paper_id
GROUP BY p.paper_id, p.title
HAVING count(*) > (SELECT count(*)::numeric / (SELECT count(*) FROM paper) FROM citation)
ORDER BY times_cited DESC, p.paper_id;

\echo '--- Q12 NOT EXISTS: papers never cited'
SELECT p.paper_id, p.title, p.pub_year
FROM paper p
WHERE NOT EXISTS (SELECT 1 FROM citation c WHERE c.cited_paper_id = p.paper_id)
ORDER BY p.paper_id;

\echo '--- Q13 NOT EXISTS: authors with no paper; subjects with no paper; papers with no subject'
SELECT 'author without paper' AS what, a.name AS value
FROM author a WHERE NOT EXISTS (SELECT 1 FROM paper_author pa WHERE pa.author_id = a.author_id)
UNION ALL
SELECT 'subject without paper', s.name
FROM subject s WHERE NOT EXISTS (SELECT 1 FROM paper_subject ps WHERE ps.subject_id = s.subject_id)
UNION ALL
SELECT 'paper without subject', p.title
FROM paper p WHERE NOT EXISTS (SELECT 1 FROM paper_subject ps WHERE ps.paper_id = p.paper_id);

\echo '--- Q14 Self-join on the bridge table: co-authors of Maya Chen'
SELECT DISTINCT a2.name AS coauthor
FROM author a1
JOIN paper_author x ON x.author_id = a1.author_id
JOIN paper_author y ON y.paper_id  = x.paper_id AND y.author_id <> x.author_id
JOIN author a2      ON a2.author_id = y.author_id
WHERE a1.name = 'Maya Chen'
ORDER BY coauthor;

\echo '--- Q15 Direct citations of paper 1 (what it cites) and who cites paper 5'
SELECT 'paper 1 cites' AS direction, p.paper_id, p.title
FROM citation c JOIN paper p ON p.paper_id = c.cited_paper_id
WHERE c.citing_paper_id = 1
UNION ALL
SELECT 'paper 5 is cited by', p.paper_id, p.title
FROM citation c JOIN paper p ON p.paper_id = c.citing_paper_id
WHERE c.cited_paper_id = 5
ORDER BY 1, 2;

\echo '--- Q16 RECURSIVE: every paper that paper 1 cites, directly or indirectly (shortest depth)'
-- Recursion is needed because the number of citation "hops" is not known in advance.
-- "<> ALL(path)" is a cycle guard.  The year rule already makes cycles impossible,
-- but the guard keeps the query safe if that rule were ever removed.
WITH RECURSIVE chain AS (
    SELECT c.cited_paper_id AS paper_id,
           1 AS depth,
           ARRAY[c.citing_paper_id, c.cited_paper_id] AS path
    FROM citation c
    WHERE c.citing_paper_id = 1
  UNION ALL
    SELECT c.cited_paper_id, ch.depth + 1, ch.path || c.cited_paper_id
    FROM citation c
    JOIN chain ch ON c.citing_paper_id = ch.paper_id
    WHERE c.cited_paper_id <> ALL (ch.path)
)
SELECT ch.paper_id, p.title, min(ch.depth) AS shortest_depth
FROM chain ch JOIN paper p ON p.paper_id = ch.paper_id
GROUP BY ch.paper_id, p.title
ORDER BY shortest_depth, ch.paper_id;

\echo '--- Q16b RECURSIVE: the longest citation chain starting at paper 1'
WITH RECURSIVE chain AS (
    SELECT c.cited_paper_id AS paper_id, 1 AS depth,
           ARRAY[c.citing_paper_id, c.cited_paper_id] AS path
    FROM citation c WHERE c.citing_paper_id = 1
  UNION ALL
    SELECT c.cited_paper_id, ch.depth + 1, ch.path || c.cited_paper_id
    FROM citation c JOIN chain ch ON c.citing_paper_id = ch.paper_id
    WHERE c.cited_paper_id <> ALL (ch.path)
)
SELECT depth, path FROM chain ORDER BY depth DESC, path LIMIT 1;

\echo '--- Q17 RECURSIVE + aggregation: how many papers build on paper 19, directly or indirectly'
-- UNION (not UNION ALL) discards rows already seen, so this terminates even on cyclic data.
WITH RECURSIVE influenced (paper_id) AS (
    SELECT citing_paper_id FROM citation WHERE cited_paper_id = 19
  UNION
    SELECT c.citing_paper_id
    FROM citation c JOIN influenced i ON c.cited_paper_id = i.paper_id
)
SELECT count(*) AS papers_that_build_on_paper_19 FROM influenced;

\echo '--- Q18 Fuzzy search, whole-title typos: "%" compares the WHOLE strings (threshold 0.3)'
SELECT paper_id, title,
       round(similarity(title, 'Transparent methods for reproducable machin learning')::numeric, 3) AS sim
FROM paper
WHERE title % 'Transparent methods for reproducable machin learning'
ORDER BY sim DESC;

\echo '--- Q19 Fuzzy search, partial typos: "<%" (word_similarity, threshold 0.6) matches a fragment inside a long title'
-- A short fragment scores low under "%" (whole-string comparison), so use "<%" for search boxes.
SELECT paper_id, title,
       round(word_similarity('machin learnin', title)::numeric, 3) AS wsim
FROM paper
WHERE 'machin learnin' <% title
ORDER BY wsim DESC, paper_id;

\echo '--- Q19b Same operator, different typo: "reproducable"'
SELECT paper_id, title,
       round(word_similarity('reproducable', title)::numeric, 3) AS wsim
FROM paper
WHERE 'reproducable' <% title
ORDER BY wsim DESC, paper_id;

\echo '--- Q20 Exact substring search (also accelerated by the trigram index)'
SELECT paper_id, title FROM paper WHERE title ILIKE '%heat%' ORDER BY paper_id;

\echo '--- Q21 Average citations per paper, per journal (derived metric, nothing stored)'
SELECT j.name AS journal,
       count(DISTINCT p.paper_id)                                   AS papers,
       round(count(c.citing_paper_id)::numeric
             / NULLIF(count(DISTINCT p.paper_id), 0), 2)            AS avg_citations_per_paper
FROM journal j
LEFT JOIN paper p    ON p.journal_id = j.journal_id
LEFT JOIN citation c ON c.cited_paper_id = p.paper_id
GROUP BY j.journal_id, j.name
ORDER BY avg_citations_per_paper DESC NULLS LAST, j.name;
