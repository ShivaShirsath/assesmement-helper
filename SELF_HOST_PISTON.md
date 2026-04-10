# Self-host Piston for compile99

Public `emkc.org` access is restricted. This project supports a custom endpoint via:

`VITE_PISTON_ENDPOINT`

## 1) Start a local Piston host

From `/Users/shiva/training-flow/compile99/piston-host`:

```bash
docker compose up -d
```

This starts Piston at:

- `http://localhost:2000/api/v2/execute`
- `http://localhost:2000/api/v2/runtimes`

## 2) Point the React app to your host

Create `/Users/shiva/training-flow/compile99/.env`:

```env
VITE_PISTON_ENDPOINT=/api/v2/execute
```

This project proxies `/api/v2/*` through Vite to `http://localhost:2000`, so browser requests stay same-origin and avoid CORS issues.
Restart Vite after changing `.env`.

## 3) Verify runtime availability

```bash
curl http://localhost:2000/api/v2/runtimes
```

If this returns `[]`, install JavaScript runtime:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"node","version":"18.15.0"}'
```

If JavaScript runtime/version differs from the app default (`18.15.0`), update
`VERSION` in `src/App.tsx` to match one available runtime.

## 4) Security note

Piston runs with Docker `privileged: true` by design. For production use,
deploy in an isolated VM/network boundary and expose only through your own API
or reverse proxy with auth/rate limits.

## 5) Stop host

```bash
docker compose down
```
