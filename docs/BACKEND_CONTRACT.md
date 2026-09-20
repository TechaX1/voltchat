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

```json
{ "response": "I am doing great! How can I help you build today?" }
```

The UI optionally simulates streaming (toggle in header, persisted as
`voltchat-streaming-enabled`).

## Chat response — Mode B: streaming (anything non-JSON)

Raw text chunks are appended live, e.g. `text/event-stream`:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: hello
data:  world
```

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
