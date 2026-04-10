# Self-host Piston for compile99

compile99 backend executes code through Piston.

## 1) Start local Piston

From `/Users/shiva/training-flow/compile99/piston-host`:

```bash
docker compose up -d
```

Piston endpoints:

- `http://localhost:2000/api/v2/execute`
- `http://localhost:2000/api/v2/runtimes`

## 2) Verify runtimes

```bash
curl http://localhost:2000/api/v2/runtimes
```

If you get `[]`, install Node runtime package:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"node","version":"18.15.0"}'
```

## 3) Backend configuration

In `/Users/shiva/training-flow/compile99/server/.env`:

```env
PORT=4000
PISTON_ENDPOINT=http://localhost:2000/api/v2/execute
```

## 4) Security

Piston runs with `privileged: true`. Use isolated environments (VM/network boundary) for production.

## 5) Stop host

```bash
docker compose down
```
