# Database scripts — Academic Research Metadata Repository

Run and checked on PostgreSQL 18.6; other versions are not tested. All sample data is fictional.

| Order | File | What it does |
|---|---|---|
| 1 | `01_schema.sql` | Creates the 8 tables, constraints, 3 business-rule triggers, indexes (incl. pg_trgm GIN). Re-runnable: drops and rebuilds. |
| 2 | `02_seed.sql` | 24 papers, 11 authors, 6 publishers, 8 journals, 9 subjects, 50 authorships, 43 classifications, 45 citations. Papers 1–6 match the current UI. |
| 3 | `03_queries.sql` | 21 demo queries: JOINs, GROUP BY/HAVING, subqueries, NOT EXISTS, window RANK, recursive citation chains, pg_trgm fuzzy search. |
| 4 | `04_constraint_tests.sql` | 39 tests that try to break each business rule. Expected result: `passed 39, failed 0`. Rolls everything back. |
| 5 | `05_trigram_demo.sql` | Loads 200,000 rows, shows `EXPLAIN ANALYZE` without and with the trigram index, then deletes the bulk rows. |
| 6 | `06_export_ui_data.sql` | Exports the table rows as one JSON document for the web interface (`npm run export-data` runs it). |

## How to run

Run these commands from inside the `db` folder.

```bash
createdb arm                       # or create a database in pgAdmin
psql -d arm -v ON_ERROR_STOP=1 -f 01_schema.sql
psql -d arm -v ON_ERROR_STOP=1 -f 02_seed.sql
psql -d arm -f 03_queries.sql
psql -d arm -f 04_constraint_tests.sql   # on Windows add: -v nulldev=NUL
psql -d arm -f 05_trigram_demo.sql
```

**pgAdmin:** scripts 03–05 use psql meta-commands (`\echo`, `\o`, `\timing`). Run them in
*Tools → PSQL Tool*, not in the Query Tool. Scripts 01 and 02 run fine in either.

`CREATE EXTENSION pg_trgm` needs no superuser on PostgreSQL 13+ if you own the database.

## Design decisions encoded here (be ready to defend them)

- DOI and ISSN are `UNIQUE` and nullable; publisher name and subject name are `UNIQUE NOT NULL`;
  author name is **not** unique (different people share names).
- `(paper_id, author_order)` is `UNIQUE`, so it is a second candidate key of PAPER_AUTHOR.
- `ON DELETE RESTRICT` for publisher→journal, journal→paper, author→paper_author.
  `ON DELETE CASCADE` for bridge/citation rows when a paper (or subject) is deleted.
- "Every paper has at least one author" = deferred constraint trigger (checked at COMMIT).
- "A paper cites only earlier-year papers" = trigger; this also makes the citation graph acyclic.
- Citation counts are never stored; they are computed (Q8–Q11, Q21).
- `%` compares whole strings; for short typo'd fragments use `<%` (word_similarity). See Q18/Q19.
