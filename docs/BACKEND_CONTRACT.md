# Backend Contract

The template is backend-agnostic. Point `VITE_WEBHOOK_URL` at any HTTP endpoint —
the UI adapts based on the response `Content-Type`.

> Also see `connect-to-backend.md` (quickstart) and `docs/RECIPES.md` (copy-paste servers).

## Demo mode

`VITE_DEMO_MODE` controls local responses from `src/lib/backends/demo.ts`:

| Value  | Behavior                              |
| ------ | ------------------------------------- |
| `auto` | demo when `VITE_WEBHOOK_URL` is empty  |
| `on`   | always demo (good for UI work)        |
| `off`  | never demo (surface backend errors)   |

## Chat request

`POST` JSON (built by `buildChatPayload()` in `src/lib/backends/webhook.ts`):

```json
{
  "message": "Hello, how are you?",
  "sessionId": "abc-123-xyz",
  "timestamp": "2024-05-07T15:30:00Z",
  "attachments": []
}
```

If `VITE_API_TOKEN` is set: `Authorization: Bearer <token>`.

## Chat response — Mode A: JSON (`application/json`)

Parsed by `extractJsonContent()`. Fields checked in order:

1. `output.response` 2. `output` (string) 3. `response` 4. `message` 5. `content`

Empty/whitespace-only values are skipped and the next field is used; if no field
holds text, the raw JSON is stringified and shown as-is.

```json
{ "response": "I am doing great! How can I help you build today?" }
```

The UI optionally simulates streaming (toggle in header, persisted as
`voltchat-streaming-enabled`).

## Chat response — Mode B: streaming (anything non-JSON)

Any content type other than `application/json` is streamed as **raw text**: the
body is appended to the chat bubble verbatim, chunk by chunk. SSE-style framing
(`data:` lines) is *not* parsed — it would render literally — so send plain text:

```http
HTTP/1.1 200 OK
Content-Type: text/plain

Hello! Streaming this reply chunk by chunk.
```

The mock server and the recipes in `docs/RECIPES.md` label their streams
`text/event-stream` while sending plain-text chunks — that also works, since only
`application/json` is special-cased. If your backend emits true SSE framing,
strip it server-side before responding.

Use `npm run mock` (`examples/mock-server/server.mjs`) to try both modes locally.

## Uploads

`POST multipart/form-data` with key `file` to `VITE_UPLOAD_URL`.
Expected JSON: `{ "status": "success", "file_id": "file_98765" }`.
When unconfigured/unreachable the UI falls back to a mock success so attachment
flows stay testable; server rejections (non-2xx) surface as upload failures
(see `uploadFileRequest()`).

Limit: `VITE_MAX_ATTACHMENTS` (default 5). Toggle UI with `VITE_ENABLE_UPLOADS`.

## CORS

The app runs in the browser — backends must allow it:

- Origins: dev `http://localhost:8026` + your prod domain
- Methods: `POST`, `OPTIONS`
- Headers: `Content-Type`, `Authorization`

## Docker note

From inside a container, `localhost` is the container itself — use
`VITE_WEBHOOK_URL=http://host.docker.internal:9732/chat` and listen on `0.0.0.0`.
Remember: Vite env vars bake in at **build** time.
