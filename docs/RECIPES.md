# Backend Recipes

Minimal servers implementing `docs/BACKEND_CONTRACT.md`. All listen on `9732`
to match `.env.example` (`npm run mock` runs the Node one with zero deps).

## Node (zero dependencies — runs via `npm run mock`)

See `examples/mock-server/server.mjs`:

- `POST /chat` → `{ "response": "You said: ..." }` (Mode A JSON)
- `POST /chat/stream` → chunked text stream (Mode B)
- `POST /upload` → `{ "status": "success", "file_id": "file_..." }`

## Python / FastAPI

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8026"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat_handler(request: Request):
    data = await request.json()
    return {"response": f"You said: {data.get('message')}"}

@app.post("/chat/stream")
async def chat_stream_handler(request: Request):
    data = await request.json()
    async def event_generator():
        for word in f"Streaming reply to: {data.get('message')}".split():
            yield word + " "
            await asyncio.sleep(0.1)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/upload")
async def upload_handler(request: Request):
    form = await request.form()
    filename = form["file"].filename if "file" in form else "unknown"
    return {"status": "success", "file_id": f"file_{filename}"}
```

Run: `uvicorn main:app --host 0.0.0.0 --port 9732`.

## n8n / LangChain / any webhook

As long as the endpoint accepts the JSON shape from `docs/BACKEND_CONTRACT.md`
and returns one of the supported response shapes, no template changes are needed —
just set `VITE_WEBHOOK_URL`.
