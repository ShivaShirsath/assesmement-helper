# compile99

Full-stack coding assessment platform using:

- Frontend: React + TypeScript + MUI (Vite)
- Backend: Node.js + Express
- Database: SQLite (`server/data/compile99.db`)
- Code execution: Piston API (self-hosted recommended)

## Architecture

- Browser talks only to backend API (`/api/...`)
- Backend stores questions, test cases, submissions in SQLite
- Backend executes code against Piston
- Hidden test cases are never sent to the browser

## Features

- Assessment page:
  - Markdown problem statement
  - Code editor
  - Run visible test cases
  - Submit full solution (visible + hidden tests)
- Question management page:
  - Create questions
  - Add visible and hidden test cases
- Persistence:
  - Questions and test cases saved in SQLite
  - Submission results saved in SQLite

## Setup

1. Start Piston (local Docker):

```bash
cd piston-host
docker compose up -d
```

2. Frontend env:

```bash
cp .env.example .env
```

3. Backend env:

```bash
cp server/.env.example server/.env
```

4. Install dependencies and run app:

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## API Summary

- `GET /api/questions` - list questions
- `GET /api/questions/:id` - question + visible test cases
- `POST /api/questions` - create question (visible + hidden test cases)
- `POST /api/questions/:id/run-visible` - run only visible cases
- `POST /api/questions/:id/submit` - run all cases, save submission
- `GET /api/submissions?questionId=...` - list saved submissions

## Notes

- Backend defaults to `PISTON_ENDPOINT=http://localhost:2000/api/v2/execute`
- Initial sample question is auto-seeded into SQLite on first run.
