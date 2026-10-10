# Academic Research Metadata Repository

A relational database system for academic research **metadata** (not the papers themselves): papers, authors,
journals, publishers, subjects and the citations between papers. Course project for *23CSE202 Database Management
Systems* (S3 B.Tech CSE, Amrita School of Computing, Amritapuri), Group A2.

The repository has two parts:

| Part | Folder | What it is |
|---|---|---|
| **Database** | [`db/`](db) | The PostgreSQL implementation: schema, sample data, queries, constraint tests, trigram-index demo. **This is the core of the project.** |
| **Web interface** | `src/` | A React prototype that presents the same data. It is a static site (GitHub Pages) and **does not query PostgreSQL at run time**. |

Live prototype: https://balgovindb.github.io/academic-repo/

## How the two parts are connected

`src/data/repository.json` is **generated from the PostgreSQL database** by `scripts/export-ui-data.sh`
(query: `db/06_export_ui_data.sql`). It contains the table rows only. Everything the interface displays beyond
that is computed from those rows, the same way the SQL queries compute it:

- citation counts = number of `citation` rows pointing at a paper (SQL Q8)
- citation ranking with ties (SQL Q9, `RANK()`)
- citations by subject (SQL Q10) and papers per journal (SQL Q5)
- the "Citation chain" on each paper page = every paper reachable by following "cites" links (SQL Q16, recursive query)
- typo-tolerant search imitates `pg_trgm` trigram similarity in the browser (SQL Q18/Q19 do it in the database)

Because the deployed site is static, a live database connection would need a separate server; this project does not
include one.

## Database (`db/`)

Run and checked on PostgreSQL 18.6; other versions are not tested.

```bash
createdb arm
psql -d arm -v ON_ERROR_STOP=1 -f db/01_schema.sql    # 8 tables, constraints, triggers, indexes (incl. pg_trgm GIN)
psql -d arm -v ON_ERROR_STOP=1 -f db/02_seed.sql      # 24 papers, 11 authors, 6 publishers, 8 journals, 9 subjects, 45 citations
psql -d arm -f db/03_queries.sql                      # 21 demonstration queries
psql -d arm -f db/04_constraint_tests.sql             # 39 rule-violation tests, expected: passed 39, failed 0 (on Windows add -v nulldev=NUL)
psql -d arm -f db/05_trigram_demo.sql                 # 200,000-row EXPLAIN ANALYZE comparison, with and without the index
```

In pgAdmin, run scripts 03 to 05 in the *PSQL Tool* (they use psql commands such as `\echo`). See
[`db/README.md`](db/README.md) for the design decisions encoded in the schema.

Design documentation (ER diagrams, relational schema, functional dependencies and normalization to BCNF):
[`docs/Database_Design_Document.docx`](docs/Database_Design_Document.docx), with the diagrams
[`docs/er_conceptual.png`](docs/er_conceptual.png) and [`docs/er_logical.png`](docs/er_logical.png).

## Web interface

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # development server
npm run build      # production build (type-checks first)
```

To rebuild the interface data after changing the database (needs `psql` and `node`; set `PGDATABASE`, and
`PGHOST`/`PGUSER`/`PGPASSWORD` if needed):

```bash
PGDATABASE=arm npm run export-data
```

### Pages

Overview · Papers (filter by subject, including "no subject") · Paper detail (authors in order, publisher, DOI,
cites, cited by, citation chain) · Authors · Journals · Publishers · Subjects · Citation explorer (top ten, ties share a
rank) · Statistics (citations by subject, papers per journal) · Search (title, author, journal, subject; typo-tolerant).

### Deployment

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on every push to `main`
(**Settings → Pages → Source: GitHub Actions**). The site uses hash URLs (for example `#/papers/1`), so direct links
work without server configuration.

## Stack

PostgreSQL 18 with the `pg_trgm` extension · React 18 · TypeScript · Vite · Tailwind CSS · React Router (hash routing) ·
Recharts · Lucide icons.

## Repository layout

```text
db/                       SQL scripts 01-06 and notes
docs/                     Design document and ER diagrams
scripts/                  export-ui-data.sh, format-json.mjs
src/
  App.tsx                 Layout and routes
  pages/                  One file per page
  components/ui.tsx       Shared components
  data/repository.json    GENERATED from PostgreSQL (do not edit by hand)
  data/repository.ts      Typed data layer and derived views
  utils/search.ts         Search over title, author, journal, subject
  utils/trigram.ts        Trigram similarity (pg_trgm imitation)
  utils/format.ts         Number and plural formatting
.github/workflows/        GitHub Pages deployment
```
