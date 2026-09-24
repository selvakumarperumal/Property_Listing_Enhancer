# Property Listing Enhancer – Backend

FastAPI service that turns plain property details into engaging real estate listings
using a HuggingFace chat model (default `Qwen/Qwen3-8B` via `featherless-ai`) through LangChain.
If the model can't be initialized or a call fails, `/enhance` returns `503` with an error `detail`.

## Layout

```
backend/
├── config/prompt.yaml      # System + human prompt templates
├── enhancer/
│   ├── config.py           # Settings loaded from env / .env
│   ├── prompt.py           # Loads prompts into ChatPromptTemplates
│   ├── llm_pipeline.py     # PropertyListingEnhancer (LLM chain)
│   └── main.py             # FastAPI app
├── Dockerfile
└── pyproject.toml / uv.lock
```

## Configuration

Copy `.env.example` to `.env` and set `HF_TOKEN`. Other settings are optional:

| Variable | Default |
|---|---|
| `HF_TOKEN` | *required* |
| `HF_THINKING_MODEL_REPO` | `Qwen/Qwen3-8B` |
| `HF_THINKING_MODEL_PROVIDER_NAME` | `featherless-ai` |
| `MAX_NEW_TOKENS` | `1024` |

## Run locally

```bash
cd backend
uv sync
uv run uvicorn enhancer.main:app --reload
```

Interactive API docs: http://localhost:8000/docs

## Run with Docker

```bash
cd backend
docker build -t property-listing-enhancer .
docker run --rm -p 8000:8000 --env-file .env property-listing-enhancer
```

## API

### `GET /health`
```json
{"status": "ok", "model": "Qwen/Qwen3-8B", "provider": "featherless-ai", "ai_available": true}
```

### `POST /enhance`
```bash
curl -X POST localhost:8000/enhance -H 'Content-Type: application/json' \
  -d '{"description": "Cozy 2-bedroom house with small garden"}'
```
```json
{"original": "Cozy 2-bedroom house with small garden", "enhanced": "Step into this charming..."}
```

Descriptions must be 3–2000 characters.
