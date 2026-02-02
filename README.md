# VoltChat ⚡

## Project info

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

### Docker: build-only image (artifacts only)

This repository includes a build-only `DOCKERFILE` which produces a minimal image containing the built static files at `/dist` and does not include any web server.

Build the image (PowerShell):

```powershell
docker build -t voltchat:dist .
```

After building, the image will contain the files at `/dist`. You can extract them or use a small server image to serve them if you need to run the app in a container:

```powershell
# extract dist from the image
docker create --name tmp voltchat:dist; docker cp tmp:/dist ./dist; docker rm tmp
```


### Setup Locally:

*   **Clone Project:**
    ```bash
    git clone
    ```

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Run Development Server:** Starts the Vite development server with hot-reloading.
    ```bash
    npm run dev
    ```

### Project Structure:

*   **`src/components`**: Contains reusable React components.
    *   `src/components/ui`: Holds the `shadcn-ui` components.
    *   `src/components/chat`: Contains application-specific components like `ChatContainer`, `ChatInput`, etc.
*   **`src/hooks`**: Custom React hooks are located here. The core application logic resides in `useChat.ts`.
*   **`src/pages`**: Contains top-level page components that are mapped to routes.
*   **`src/lib`**: Utility functions.
*   **`src/types`**: TypeScript type definitions.


## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS