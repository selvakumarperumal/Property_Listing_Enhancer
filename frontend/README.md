# Property Listing Enhancer – Frontend

Node.js (Express) web UI for the Property Listing Enhancer. It serves the static page in
`public/` and forwards `/api/*` calls to the FastAPI backend, so the browser never talks
to the backend directly and no CORS setup is needed.

| Route | Forwards to |
|---|---|
| `GET /api/health` | `GET {BACKEND_URL}/health` |
| `POST /api/enhance` | `POST {BACKEND_URL}/enhance` |
| `GET /healthz` | Frontend liveness (no backend call) |

## Configuration

| Variable | Default |
|---|---|
| `PORT` | `3000` |
| `BACKEND_URL` | `http://localhost:8000` (`http://backend:8000` in Docker) |
| `BACKEND_TIMEOUT_MS` | `120000` |

## Run locally

Start the backend first (see `../backend/README.md`), then:

```bash
cd frontend
npm install
npm run dev        # or: npm start
```

Open http://localhost:3000
