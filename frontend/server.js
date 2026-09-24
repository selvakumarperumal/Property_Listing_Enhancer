import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 3000);
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const BACKEND_TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 120_000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Forward a request to the backend and relay its status and JSON body.
async function proxy(res, method, backendPath, body) {
  try {
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({ detail: "Invalid response from backend" }));
    res.status(response.status).json(data);
  } catch (err) {
    const timedOut = err.name === "TimeoutError";
    console.error(`Backend ${method} ${backendPath} failed:`, err.message);
    res.status(timedOut ? 504 : 502).json({
      detail: timedOut ? "Backend timed out" : "Backend is unreachable",
    });
  }
}

app.get("/api/health", (req, res) => proxy(res, "GET", "/health"));

app.post("/api/enhance", (req, res) =>
  proxy(res, "POST", "/enhance", { description: req.body?.description ?? "" }),
);

// Liveness of the frontend itself, independent of the backend
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Frontend listening on http://0.0.0.0:${PORT} (backend: ${BACKEND_URL})`);
});
