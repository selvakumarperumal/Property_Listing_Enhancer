# Property_Listing_Enhancer
An AI-powered tool built with LangChain that transforms plain property details into engaging real estate content

## Project structure

| Path | Description |
|---|---|
| `Property_Listing_Enhancer.ipynb` | Notebook prototype |
| `backend/` | FastAPI + LangChain service using a HuggingFace chat model ([README](backend/README.md)) |
| `frontend/` | Node.js (Express) web UI that proxies to the backend ([README](frontend/README.md)) |
| `docker-compose.yml` | Runs both services together |

## Run with Docker Compose

The backend reads its settings from environment variables. Export them in your shell
(e.g. via `.envrc` / direnv) or put them in a `.env` file next to `docker-compose.yml`:

| Variable | Default |
|---|---|
| `HF_TOKEN` | *required* |
| `HF_THINKING_MODEL_REPO` | `Qwen/Qwen3-8B` |
| `HF_THINKING_MODEL_PROVIDER_NAME` | `featherless-ai` |
| `MAX_NEW_TOKENS` | `1024` |
| `FRONTEND_PORT` | `3000` (host port for the web UI) |
| `BACKEND_PORT` | `8001` (host port for the API) |

```bash
export HF_TOKEN=hf_...
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8001/docs

Stop with `docker compose down`.
