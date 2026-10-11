# Academic Research Metadata Repository

A relational database system for academic research **metadata** (not the papers themselves): papers, authors,
journals, publishers, subjects and the citations between papers. Course project for *23CSE202 Database Management
Systems* (S3 B.Tech CSE, Amrita School of Computing, Amritapuri), Group A2.

The repository has three parts:

| Part | Folder | What it is |
|---|---|---|
| **Database** | [`db/`](db) | The PostgreSQL implementation: schema, sample data, queries, constraint tests, trigram-index demo. **Core of the project.** |
| **Backend API** | [`backend/`](backend) | Node.js Express service running live PostgreSQL queries (`pg` pool) for real database operations. |
| **Web interface** | `src/` | A React prototype that visualizes research metadata, searches, and citation analysis. |

Live prototype (static demo): https://balgovindb.github.io/academic-repo/

## How things are connected

The React client communicates with the PostgreSQL database through the Express backend service:

- Overview & Metrics: Counts across entities and latest publications.
- Papers & Authors: Joined via bridge tables (`paper_author`), authors in explicit order.
- Citation Graph: Computes multi-hop citation chains using PostgreSQL **Recursive CTE** (SQL Q16).
- Analytics: Live rankings computed with window functions (`RANK()`, SQL Q9).
- Typo-Tolerant Search: Uses PostgreSQL `pg_trgm` GIN index with `<%` word similarity (SQL Q18/Q19).

## Running the project locally

### 1. Database (`db/`)

Start PostgreSQL (e.g. using Docker):
```bash
docker run -d --name postgres-dev -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
```

Initialize the database schema and seed data:
```bash
# Inside docker container or via psql:
docker exec -i postgres-dev psql -U postgres -c "CREATE DATABASE arm;"
Get-Content db/01_schema.sql | docker exec -i postgres-dev psql -U postgres -d arm -v ON_ERROR_STOP=1
Get-Content db/02_seed.sql   | docker exec -i postgres-dev psql -U postgres -d arm -v ON_ERROR_STOP=1
```

Run test suite and trigram demo:
```bash
# 39 rule-violation constraint tests:
Get-Content db/04_constraint_tests.sql | docker exec -i postgres-dev psql -U postgres -d arm
```

### 2. Backend API (`backend/`)

Requires Node.js 18+.

```bash
cd backend
npm install
npm start        # runs on http://localhost:5000
# or for development:
npm run dev
```

### 3. Web interface (`src/`)

```bash
npm install
npm run dev      # runs Vite development server on http://localhost:5173
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
