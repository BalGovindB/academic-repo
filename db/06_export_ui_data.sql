-- =====================================================================
-- 06_export_ui_data.sql : exports the repository contents as ONE JSON
-- document for the web UI (src/data/repository.json).
-- Every number the UI shows is derived from these rows; nothing is stored
-- twice.  Citation counts are NOT exported: the UI counts the rows of
-- "citedBy", which come from the citation table.
-- Run with:  sh scripts/export-ui-data.sh      (needs psql and node)
-- =====================================================================
SELECT json_build_object(
  'publishers', (SELECT json_agg(json_build_object('id', publisher_id, 'name', name)
                                 ORDER BY publisher_id) FROM publisher),
  'journals',   (SELECT json_agg(json_build_object('id', journal_id, 'name', name, 'issn', issn,
                                                   'publisherId', publisher_id)
                                 ORDER BY journal_id) FROM journal),
  'authors',    (SELECT json_agg(json_build_object('id', author_id, 'name', name,
                                                   'affiliation', affiliation)
                                 ORDER BY author_id) FROM author),
  'subjects',   (SELECT json_agg(json_build_object('id', subject_id, 'name', name)
                                 ORDER BY subject_id) FROM subject),
  'papers',     (SELECT json_agg(json_build_object(
                    'id', p.paper_id, 'title', p.title, 'year', p.pub_year, 'doi', p.doi,
                    'abstract', p.abstract, 'journalId', p.journal_id,
                    'authorIds',  (SELECT coalesce(json_agg(pa.author_id ORDER BY pa.author_order), '[]'::json)
                                   FROM paper_author pa WHERE pa.paper_id = p.paper_id),
                    'subjectIds', (SELECT coalesce(json_agg(ps.subject_id ORDER BY ps.subject_id), '[]'::json)
                                   FROM paper_subject ps WHERE ps.paper_id = p.paper_id),
                    'cites',      (SELECT coalesce(json_agg(c.cited_paper_id ORDER BY c.cited_paper_id), '[]'::json)
                                   FROM citation c WHERE c.citing_paper_id = p.paper_id),
                    'citedBy',    (SELECT coalesce(json_agg(c.citing_paper_id ORDER BY c.citing_paper_id), '[]'::json)
                                   FROM citation c WHERE c.cited_paper_id = p.paper_id)
                  ) ORDER BY p.paper_id) FROM paper p)
);
