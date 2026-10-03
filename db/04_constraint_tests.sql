-- =====================================================================
-- 04_constraint_tests.sql : tries to BREAK each business rule.
-- Every "expect_error" test must be rejected by PostgreSQL with the stated
-- SQLSTATE; every "expect_ok" test must succeed.  All test changes are rolled
-- back, so the data is untouched.  Run after 01 and 02.
--   unique_violation=23505  not_null=23502  fk_violation=23503  check=23514
-- (custom trigger rules raise check_violation=23514)
-- =====================================================================

CREATE TEMP TABLE test_results (n SERIAL, label TEXT, expected TEXT, outcome TEXT);

-- run a statement that MUST fail with the expected SQLSTATE
CREATE FUNCTION pg_temp.expect_error(label TEXT, stmt TEXT, expected TEXT) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE got TEXT;
BEGIN
    BEGIN
        EXECUTE stmt;
        RAISE EXCEPTION 'statement succeeded' USING ERRCODE = 'XX999';
    EXCEPTION WHEN OTHERS THEN
        got := SQLSTATE;
    END;                                   -- everything inside is rolled back
    IF got = expected THEN
        INSERT INTO test_results (label, expected, outcome) VALUES (label, expected, 'PASS (rejected)');
    ELSIF got = 'XX999' THEN
        INSERT INTO test_results (label, expected, outcome) VALUES (label, expected, 'FAIL (was accepted!)');
    ELSE
        INSERT INTO test_results (label, expected, outcome) VALUES (label, expected, 'FAIL (got ' || got || ')');
    END IF;
END $$;

-- run a statement that MUST succeed (then undo it)
CREATE FUNCTION pg_temp.expect_ok(label TEXT, stmt TEXT) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE got TEXT;
BEGIN
    BEGIN
        EXECUTE stmt;
        RAISE EXCEPTION 'rollback' USING ERRCODE = 'XX998';
    EXCEPTION WHEN OTHERS THEN
        got := SQLSTATE;
    END;
    IF got = 'XX998' THEN
        INSERT INTO test_results (label, expected, outcome) VALUES (label, 'ok', 'PASS (accepted)');
    ELSE
        INSERT INTO test_results (label, expected, outcome) VALUES (label, 'ok', 'FAIL (got ' || got || ')');
    END IF;
END $$;

-- hide the helper calls' empty output rows
\if :{?nulldev}
\else
\set nulldev /dev/null
\endif
\o :nulldev

-- ---------- PUBLISHER / JOURNAL ----------
SELECT pg_temp.expect_error('duplicate publisher name',
  $$INSERT INTO publisher (name) VALUES ('Helix Open Science')$$, '23505');
SELECT pg_temp.expect_error('publisher name NULL',
  $$INSERT INTO publisher (name) VALUES (NULL)$$, '23502');
SELECT pg_temp.expect_error('journal without publisher (NOT NULL)',
  $$INSERT INTO journal (name, issn, publisher_id) VALUES ('X', '1111-1111', NULL)$$, '23502');
SELECT pg_temp.expect_error('journal with non-existent publisher (FK)',
  $$INSERT INTO journal (name, issn, publisher_id) VALUES ('X', '1111-1111', 999)$$, '23503');
SELECT pg_temp.expect_error('malformed ISSN',
  $$INSERT INTO journal (name, issn, publisher_id) VALUES ('X', '12345678', 1)$$, '23514');
SELECT pg_temp.expect_error('duplicate ISSN',
  $$INSERT INTO journal (name, issn, publisher_id) VALUES ('X', '2041-1006', 1)$$, '23505');
SELECT pg_temp.expect_ok('journal with NULL issn is allowed',
  $$INSERT INTO journal (name, issn, publisher_id) VALUES ('No-ISSN Journal', NULL, 1)$$);
SELECT pg_temp.expect_error('delete publisher that owns journals (RESTRICT)',
  $$DELETE FROM publisher WHERE publisher_id = 1$$, '23001');
SELECT pg_temp.expect_ok('delete publisher with no journals',
  $$DELETE FROM publisher WHERE publisher_id = 6$$);

-- ---------- PAPER ----------
SELECT pg_temp.expect_error('paper without journal (NOT NULL)',
  $$INSERT INTO paper (title, pub_year, journal_id) VALUES ('T', 2020, NULL)$$, '23502');
SELECT pg_temp.expect_error('paper in non-existent journal (FK)',
  $$INSERT INTO paper (title, pub_year, journal_id) VALUES ('T', 2020, 999)$$, '23503');
SELECT pg_temp.expect_error('paper year out of range',
  $$INSERT INTO paper (title, pub_year, journal_id) VALUES ('T', 1500, 1)$$, '23514');
SELECT pg_temp.expect_error('duplicate DOI',
  $$INSERT INTO paper (title, pub_year, doi, journal_id) VALUES ('T', 2020, '10.5555/arm.2024.0001', 1)$$, '23505');
SELECT pg_temp.expect_error('malformed DOI',
  $$INSERT INTO paper (title, pub_year, doi, journal_id) VALUES ('T', 2020, 'not-a-doi', 1)$$, '23514');
SELECT pg_temp.expect_error('delete journal that has papers (RESTRICT)',
  $$DELETE FROM journal WHERE journal_id = 1$$, '23001');
SELECT pg_temp.expect_ok('delete journal with no papers',
  $$DELETE FROM journal WHERE journal_id = 8$$);

-- ---------- "every paper has >= 1 author" (deferred trigger) ----------
SELECT pg_temp.expect_error('paper with NO author is rejected at commit',
  $$INSERT INTO paper (title, pub_year, journal_id) VALUES ('Orphan', 2020, 1);
    SET CONSTRAINTS ALL IMMEDIATE$$, '23514');
SELECT pg_temp.expect_ok('paper + author inserted in same transaction is accepted',
  $$WITH p AS (INSERT INTO paper (title, pub_year, journal_id) VALUES ('Fine', 2020, 1) RETURNING paper_id)
    INSERT INTO paper_author SELECT paper_id, 1, 1 FROM p;
    SET CONSTRAINTS ALL IMMEDIATE$$);
SELECT pg_temp.expect_error('removing the LAST author of a paper is rejected',
  $$DELETE FROM paper_author WHERE paper_id = 6;
    SET CONSTRAINTS ALL IMMEDIATE$$, '23514');
SELECT pg_temp.expect_ok('removing one of several authors is accepted',
  $$DELETE FROM paper_author WHERE paper_id = 1 AND author_id = 2;
    SET CONSTRAINTS ALL IMMEDIATE$$);
SELECT pg_temp.expect_ok('deleting a whole paper cascades without tripping the author rule',
  $$DELETE FROM paper WHERE paper_id = 7;
    SET CONSTRAINTS ALL IMMEDIATE$$);

-- ---------- PAPER_AUTHOR ----------
SELECT pg_temp.expect_error('same author twice on one paper (PK)',
  $$INSERT INTO paper_author VALUES (1, 1, 5)$$, '23505');
SELECT pg_temp.expect_error('two authors in the same position (UNIQUE paper_id, author_order)',
  $$INSERT INTO paper_author VALUES (1, 3, 1)$$, '23505');
SELECT pg_temp.expect_error('author_order = 0',
  $$INSERT INTO paper_author VALUES (1, 3, 0)$$, '23514');
SELECT pg_temp.expect_error('author link to non-existent author (FK)',
  $$INSERT INTO paper_author VALUES (1, 999, 9)$$, '23503');
SELECT pg_temp.expect_error('delete an author who has papers (RESTRICT)',
  $$DELETE FROM author WHERE author_id = 1$$, '23001');
SELECT pg_temp.expect_ok('delete an author with no papers',
  $$DELETE FROM author WHERE author_id = 11$$);

-- ---------- SUBJECT / PAPER_SUBJECT ----------
SELECT pg_temp.expect_error('duplicate subject name',
  $$INSERT INTO subject (name) VALUES ('Psychology')$$, '23505');
SELECT pg_temp.expect_error('same subject twice on one paper (PK)',
  $$INSERT INTO paper_subject VALUES (1, 1)$$, '23505');
SELECT pg_temp.expect_ok('paper may have no subject (optional)',
  $$DELETE FROM paper_subject WHERE paper_id = 12$$);
SELECT pg_temp.expect_ok('deleting a subject removes only its classification rows (CASCADE)',
  $$DELETE FROM subject WHERE subject_id = 1$$);

-- ---------- CITATION ----------
SELECT pg_temp.expect_error('paper cites itself',
  $$INSERT INTO citation VALUES (1, 1)$$, '23514');
SELECT pg_temp.expect_error('duplicate citation row (PK)',
  $$INSERT INTO citation VALUES (1, 5)$$, '23505');
SELECT pg_temp.expect_error('citation to non-existent paper (FK)',
  $$INSERT INTO citation VALUES (1, 999)$$, '23503');
SELECT pg_temp.expect_error('older paper cites a NEWER paper (year rule)',
  $$INSERT INTO citation VALUES (19, 1)$$, '23514');
SELECT pg_temp.expect_error('same-year citation (year rule is strict)',
  $$INSERT INTO citation VALUES (5, 6)$$, '23514');
SELECT pg_temp.expect_ok('valid citation to an earlier paper',
  $$INSERT INTO citation VALUES (2, 19)$$);
SELECT pg_temp.expect_error('changing a paper''s year so an existing citation breaks',
  $$UPDATE paper SET pub_year = 2017 WHERE paper_id = 1$$, '23514');
SELECT pg_temp.expect_ok('deleting a cited paper removes its citation rows (CASCADE)',
  $$DELETE FROM paper WHERE paper_id = 17;
    SET CONSTRAINTS ALL IMMEDIATE$$);

-- show output again
\o

-- ---------- RESULTS ----------
SELECT n, label, outcome FROM test_results ORDER BY n;
SELECT count(*) FILTER (WHERE outcome LIKE 'PASS%') AS passed,
       count(*) FILTER (WHERE outcome LIKE 'FAIL%') AS failed,
       count(*)                                     AS total
FROM test_results;
