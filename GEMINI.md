## Project Overview

This project, named "VoltChat", is a high-performance, frontend chat interface designed for developers. It's built using a modern web stack including **Vite, React, TypeScript, and Tailwind CSS**. The UI is composed of components from **shadcn-ui**.

The core functionality allows a user to interact with an AI backend. The application is architected to be backend-agnostic; it connects to any AI service via a configurable **webhook URL**. Messages are sent to this webhook, and responses are streamed back to the user interface.

If no webhook is configured, the application runs in a "demo mode" with simulated, pre-defined responses. State, including the webhook URL and chat history, is persisted in the browser's `localStorage`.

### Key Features:

*   **Backend Agnostic:** Connects to any service via a webhook.
*   **Stateful UI:** Persists chat history and webhook configuration locally.
*   **Demo Mode:** Fully functional UI even without a backend connected.
*   **Streaming Responses:** Simulates a real-time streaming effect for incoming messages.
*   **Modern Stack:** Utilizes Vite for fast development and bundling, with a full TypeScript and React foundation.

## Building and Running

The project uses `npm` for package management.

### Key Commands:

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Run Development Server:** Starts the Vite development server with hot-reloading.
    ```bash
    npm run dev
    ```

*   **Create Production Build:** Bundles the application for production.
    ```bash
    npm run build
    ```

*   **Run Linter:** Lints the codebase using ESLint to check for code quality and style issues.
    ```bash
    npm run lint
    ```

*   **Run Tests:** Executes the test suite using Vitest.
    ```bash
    npm run test
    ```

## Development Conventions

### Project Structure:

*   **`src/components`**: Contains reusable React components.
    *   `src/components/ui`: Holds the `shadcn-ui` components.
    *   `src/components/chat`: Contains application-specific components like `ChatContainer`, `ChatInput`, etc.
*   **`src/hooks`**: Custom React hooks are located here. The core application logic resides in `useChat.ts`.
*   **`src/pages`**: Contains top-level page components that are mapped to routes.
*   **`src/lib`**: Utility functions.
*   **`src/types`**: TypeScript type definitions.

### State Management:

*   The primary application state (messages, loading status, webhook config) is managed within the `useChat` custom hook (`src/hooks/useChat.ts`).
*   Data fetching and server state management are handled by TanStack Query (`@tanstack/react-query`), although the primary interaction in `useChat` uses the native `fetch` API.

### Styling:

*   Styling is done using **Tailwind CSS**.
*   The project uses a pre-configured set of UI components from **shadcn-ui**, which are themselves built on Radix UI primitives.

## Ported & Implemented Features (Recent 6 Commits)

We have ported and expanded upon six critical frontend features from the `repo-reader` project:

1. **Collapsible Tool Call List**
   - Collapses tool call items when more than 3 are present. Displays the first 2 and a `+ N more tool calls` toggle.
   - Real-time status indicators: amber pulsing for `running`, green for `done`, and red for `error`.
   - Toggle chevron to expand individual tool execution detail boxes.

2. **Advanced Code Blocks & GFM Tables**
   - Renders code blocks with a borderless, curved container styled under the **Atom One Dark** theme.
   - Header bar uses matching Atom backgrounds (`#282c34`) and features language labels and a copy button with direct feedback checkmarks.
   - Integrated `remark-gfm` with `ReactMarkdown` to support markdown tables and strikethroughs natively.
   - Custom inline code styles applied to any backtick content outside syntax-highlighted blocks.

3. **One-Time Auto-Scrolling**
   - Auto-scrolling to the bottom of the container triggers strictly once on message list expansion (when a user sends a message or when a streaming reply starts).
   - Indefinite force-scrolling is disabled so users can scroll back up and read text/code while streaming is active.

4. **Dynamic Simulated Upload Fallback**
   - If the backend/upload server is unreachable or offline, the file upload mechanism switches dynamically to a **Simulated Upload** fallback.
   - Displays attachment loaders, uploads mock file references, and lets you test attachments seamlessly.
   - Limit of uploads is controlled by the `VITE_MAX_ATTACHMENTS` env flag.

5. **`window.fetch.bind(window)` Integration**
   - Configured `HttpAgent` in `useChat.ts` to bind fetch requests to window, preventing context-binding errors in several browsers.

6. **Instant `treeVersion` Bumps**
   - Refined event handling in `useChat.ts` to trigger a tree version bump upon `TOOL_CALL_END` for fast sidebar UI reactivity.

