# VoltChat ⚡

![Screenshot 2026-01-18 175318](https://github.com/user-attachments/assets/8ccad6d3-b541-4acd-b1f2-34805dbee882)![Screenshot 2026-01-18 175334](https://github.com/user-attachments/assets/af611872-a2dc-4432-b8f6-ff2e1450f7cd)



## Project info

This project, named "VoltChat", is a high-performance, frontend chat interface designed for developers. It's built using a modern web stack including **Vite, React, TypeScript, and Tailwind CSS**. The UI is composed of components from **shadcn-ui**.

The core functionality allows a user to interact with an AI backend. The application is architected to be backend-agnostic; it connects to any AI service via a configurable **webhook URL**. See the [Backend Connection Guide](./connect-to-backend.md) for detailed integration instructions.

If no webhook is configured, the application runs in a "demo mode" with simulated, pre-defined responses. State, including the webhook URL and chat history, is persisted in the browser's `localStorage`.

### Key Features:

*   **Backend Agnostic:** Connects to any service via a webhook.
*   **Stateful UI:** Persists chat history and webhook configuration locally.
*   **Demo Mode:** Fully functional UI even without a backend connected.
*   **Real & Simulated Streaming:** Supports true real-time streaming (via `text/event-stream`) or simulated streaming for standard JSON backend endpoints.
*   **Modern Stack:** Utilizes Vite for fast development and bundling, with a full TypeScript and React foundation.

## Configuration

VoltChat is designed to be easily integrated with your own AI backend. You can configure it using environment variables in a `.env` file at the root of the project:

```env
# The URL of your AI chat endpoint (POST)
VITE_WEBHOOK_URL=https://your-api.com/chat

# Optional: Bearer token for authentication
VITE_API_TOKEN=your_secure_token

# Branding and Customization
VITE_APP_NAME=VoltChat
VITE_APP_DESCRIPTION=A high-performance chat interface.
VITE_APP_LOGO_URL=https://your-api.com/logo.png
VITE_FAVICON_URL=https://your-api.com/favicon.svg

# File Upload Configuration
VITE_ENABLE_UPLOADS=true
VITE_UPLOAD_URL=https://your-api.com/upload
```

### Integration Details
- **Branding**: `VITE_APP_NAME`, `VITE_APP_DESCRIPTION`, `VITE_APP_LOGO_URL`, and `VITE_FAVICON_URL` will update the UI title, welcome message, logos, and icons.
- **Upload Toggle**: Setting `VITE_ENABLE_UPLOADS=false` will hide the `+` button entirely, even if a URL is provided.
- **Chat**: Messages are sent as a POST request with a JSON body: `{ "message": "string", "sessionId": "string", "timestamp": "ISO-string" }`.
- **Upload**: Files are sent as `multipart/form-data` with the key `file`.
- **Auth**: If `VITE_API_TOKEN` is set, all requests will include an `Authorization: Bearer <token>` header.

## Building and Running

The project works with `npm` **or** `bun` for package management.

### Docker: Nginx-served production image

The `Dockerfile` builds the app and serves `/dist` via Nginx (SPA fallback
included in `nginx.conf`). Vite env vars bake in at build time:

```powershell
docker build -t voltchat .
docker run -p 8026:80 voltchat
# or: docker compose up --build  # http://localhost:8026
```

To point at a backend, rebuild with `--build-arg VITE_WEBHOOK_URL=...`
or set it in `.env` before building. From inside a container use
`http://host.docker.internal:9732/chat` for a host-local backend.

### Setup Locally:

*   **Clone Project:**
    ```bash
    git clone <url> voltchat && cd voltchat
    ```

*   **Env (required):**
    ```bash
    cp .env.example .env
    ```

*   **Install Dependencies (npm or bun):**
    ```bash
    npm install   # or: bun install
    ```

*   **Run Development Server:** Starts the Vite development server with hot-reloading.
    ```bash
    npm run dev   # or: bun run dev  → http://localhost:8026
    ```

*   **Verify (typecheck, lint, tests, build):**
    ```bash
    npm run typecheck; npm run lint; npm run test; npm run build
    ```

### Docs:
- [`docs/BACKEND_CONTRACT.md`](./docs/BACKEND_CONTRACT.md) — request/response contract + demo modes
- [`docs/RECIPES.md`](./docs/RECIPES.md) — FastAPI/Node/n8n servers (`npm run mock` for zero-dep fake)
- [`docs/THEMING.md`](./docs/THEMING.md) — branding via `VITE_APP_*` + themes
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, checks, conventions

### Project Structure:

*   **`src/components`**: Contains reusable React components.
    *   `src/components/ui`: Holds the `shadcn-ui` components.
    *   `src/components/chat`: Contains application-specific components like `ChatContainer`, `ChatInput`, etc.
*   **`src/hooks`**: Custom React hooks are located here. The core application logic resides in `useChat.ts`.
*   **`src/pages`**: Contains top-level page components that are mapped to routes.
*   **`src/lib`**: Utility functions.
*   **`src/types`**: TypeScript type definitions.


## Recent Improvements & Customizations

VoltChat has been enhanced with advanced developer-focused features ported and adapted from the `repo-reader` project:

### 1. Advanced Markdown & Code Blocks
* **Syntax Highlighting**: Custom code blocks are rendered using `react-syntax-highlighter` under the **Atom One Dark** theme.
* **Unified Borderless Code View**: Fenced code blocks no longer have boxy outer wrapper backgrounds or borders. They are styled seamlessly as a header bar (`#282c34`) and code panel.
* **Easy Copying**: A dedicated Copy button appears in the upper right corner of code headers, giving immediate visual feedback (✓ checkmark) when clicked.
* **Inline Code Custom Styling**: Inline code is styled with a subtle background (`bg-zinc-800/85 text-zinc-200`) and a compact monospace font size (`11px`).
* **GitHub Flavored Markdown (GFM)**: Built-in GFM support via `remark-gfm` guarantees clean HTML tables, strikethrough, autolinks, and task lists.

### 2. Collapsible Tool Call Log
* When an agent invokes more than 3 tool runs, the UI consolidates the list into the first 2 items, showing a `+ N more tool calls` toggle button.
* Includes status indication dots:
  * **Amber pulsing** dot for `running` status.
  * **Emerald green** dot for `done` status.
  * **Red** dot for `error` status.
* Collapsible detail chevron for each individual tool run.

### 3. Smarter Auto-Scrolling
* Auto-scrolling to the bottom occurs only once when a new message is sent by the user or when the assistant placeholder begins.
* It does *not* force scroll down indefinitely during message streaming, allowing developers to scroll up and inspect code or logs freely during active generation.

### 4. Robust Offline & File Upload Fallbacks
* If file uploads are enabled but the backend/upload server is offline, VoltChat automatically switches to a graceful **Simulated/Mock Upload** fallback. This ensures the attachment queue UI, loader animations, and message submission can be thoroughly tested visually.
* Uses `VITE_MAX_ATTACHMENTS` in the `.env` to enforce maximum files, alerting users with toast notifications if exceeded.

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- remark-gfm (Markdown tables)
- react-syntax-highlighter (Atom One Dark theme)

