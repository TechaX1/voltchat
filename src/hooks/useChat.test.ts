import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { UploadResult } from "@/types/chat";

type UseChatModule = typeof import("@/hooks/useChat");

// The hook reads VITE_* values at module scope, so stub the env BEFORE each
// fresh import; vi.resetModules() forces the module to re-evaluate per call.
const loadHook = async () => {
  vi.resetModules();
  const mod: UseChatModule = await import("@/hooks/useChat");
  return mod.useChat;
};

const MESSAGES_KEY = "voltchat-messages";
const WEBHOOK_KEY = "voltchat-webhook-url";

function jsonFetchMock(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: async () => data,
  });
}

function streamFetchMock(chunks: string[]) {
  const encoder = new TextEncoder();
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => "text/event-stream" },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  });
}

const makeFile = (name = "notes.txt") =>
  new File(["hello"], name, { type: "text/plain" });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  // Isolate tests from any local .env file: default to demo mode (no backend).
  vi.stubEnv("VITE_WEBHOOK_URL", "");
  vi.stubEnv("VITE_UPLOAD_URL", "");
  vi.stubEnv("VITE_API_TOKEN", "");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useChat initial state", () => {
  it("starts in demo mode with empty state", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.webhookConfig.isConnected).toBe(false);
    expect(result.current.isStreamingEnabled).toBe(true);
  });

  it("ignores blank messages", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      void result.current.sendMessage("   ");
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useChat demo mode", () => {
  it("completes a message without streaming when streaming is disabled", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.toggleStreaming();
    });
    expect(result.current.isStreamingEnabled).toBe(false);

    act(() => {
      void result.current.sendMessage("hello");
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("hello");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].status).toBe("complete");
    expect(result.current.messages[1].content).toContain("Connected. Ready");
  });

  it("streams demo responses when streaming is enabled", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      void result.current.sendMessage("hello");
    });

    // Demo delay is 300ms; the placeholder streams after that.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.messages[1].status).toBe("streaming");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });

    expect(result.current.messages[1].status).toBe("complete");
    expect(result.current.messages[1].content).toContain("Connected. Ready");
    expect(result.current.isLoading).toBe(false);
  });

  it("answers code questions with a python example in demo mode", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.toggleStreaming();
    });
    act(() => {
      void result.current.sendMessage("write python snake game code");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.messages[1].content).toContain("```python");
    expect(result.current.messages[1].content).toContain("turtle");
  });

  it("stopStreaming halts an in-flight response", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      void result.current.sendMessage("hello");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.messages[1].status).toBe("streaming");

    act(() => {
      result.current.stopStreaming();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages[1].status).toBe("complete");

    // No further streaming updates after stopping.
    const partial = result.current.messages[1].content;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(result.current.messages[1].content).toBe(partial);
  });
});

describe("useChat persistence", () => {
  it("persists messages and reloads them on mount", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.toggleStreaming();
    });
    act(() => {
      void result.current.sendMessage("hello");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(localStorage.getItem(MESSAGES_KEY)).not.toBeNull();

    const { result: reloaded } = renderHook(() => useChat());
    expect(reloaded.current.messages).toHaveLength(2);
    expect(reloaded.current.messages[0].content).toBe("hello");
    expect(reloaded.current.messages[0].timestamp).toBeInstanceOf(Date);
    expect(reloaded.current.isStreamingEnabled).toBe(false);
  });

  it("clearMessages empties history and rotates the session id", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    const firstSession = sessionStorage.getItem("voltchat-session-id");

    act(() => {
      result.current.toggleStreaming();
    });
    act(() => {
      void result.current.sendMessage("hello");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(localStorage.getItem(MESSAGES_KEY)).toBeNull();
    expect(sessionStorage.getItem("voltchat-session-id")).not.toBe(firstSession);
  });
});

describe("useChat webhook config", () => {
  it("updates the webhook URL and persists it", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.updateWebhookUrl("https://ai.example.test/chat");
    });

    expect(result.current.webhookConfig).toMatchObject({
      url: "https://ai.example.test/chat",
      isConnected: true,
    });
    expect(localStorage.getItem(WEBHOOK_KEY)).toBe("https://ai.example.test/chat");
  });

  it("ignores manual updates when the URL comes from env", async () => {
    vi.stubEnv("VITE_WEBHOOK_URL", "https://env.example.test/chat");
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());

    expect(result.current.webhookConfig).toMatchObject({
      url: "https://env.example.test/chat",
      isConnected: true,
      isExternal: true,
    });

    act(() => {
      result.current.updateWebhookUrl("https://other.example.test/chat");
    });

    expect(result.current.webhookConfig.url).toBe("https://env.example.test/chat");
  });
});

describe("useChat backend integration", () => {
  it("posts to the webhook and prefers output.response when parsing JSON", async () => {
    const useChat = await loadHook();
    const fetchMock = jsonFetchMock({
      output: { response: "nested reply" },
      response: "top-level reply",
    });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.updateWebhookUrl("https://ai.example.test/chat");
    });
    act(() => {
      result.current.toggleStreaming();
    });

    await act(async () => {
      await result.current.sendMessage("ping");
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ai.example.test/chat");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as {
      message: string;
      sessionId: string;
    };
    expect(body.message).toBe("ping");
    expect(typeof body.sessionId).toBe("string");

    expect(result.current.messages[1].content).toBe("nested reply");
    expect(result.current.messages[1].status).toBe("complete");
    expect(result.current.isLoading).toBe(false);
  });

  it("assembles real streaming (SSE) responses chunk by chunk", async () => {
    const useChat = await loadHook();
    const fetchMock = streamFetchMock(["Hello ", "stream"]);
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.updateWebhookUrl("https://ai.example.test/stream");
    });

    await act(async () => {
      await result.current.sendMessage("stream please");
    });

    expect(result.current.messages[1].content).toBe("Hello stream");
    expect(result.current.messages[1].status).toBe("complete");
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useChat.uploadFile", () => {
  it("falls back to a simulated upload when no upload endpoint is configured", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    const file = makeFile();

    let upload: UploadResult | undefined;
    act(() => {
      void result.current.uploadFile(file).then((r) => {
        upload = r;
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(upload?.success).toBe(true);
    expect(upload?.simulated).toBe(true);
    expect(upload?.data?.file_id).toMatch(/^file_mock_/);
  });

  it("returns the server payload on a real successful upload", async () => {
    vi.stubEnv("VITE_WEBHOOK_URL", "http://test/chat");
    vi.stubEnv("VITE_UPLOAD_URL", "http://test/upload");
    const useChat = await loadHook();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "success", file_id: "file_123" }),
      })
    );
    const { result } = renderHook(() => useChat());

    let upload: UploadResult | undefined;
    await act(async () => {
      upload = await result.current.uploadFile(makeFile());
    });

    expect(upload?.success).toBe(true);
    expect(upload?.simulated).toBeUndefined();
    expect(upload?.message).toBeUndefined();
    expect(upload?.data?.file_id).toBe("file_123");
  });

  it("falls back to a simulated attachment — marked as such — when the upload server is unreachable", async () => {
    vi.stubEnv("VITE_WEBHOOK_URL", "http://test/chat");
    vi.stubEnv("VITE_UPLOAD_URL", "http://test/upload");
    const useChat = await loadHook();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );
    const { result } = renderHook(() => useChat());

    let upload: UploadResult | undefined;
    act(() => {
      void result.current.uploadFile(makeFile()).then((r) => {
        upload = r;
      });
    });
    // The fallback sleeps 500ms before returning.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Never a bare fake success: simulated must be set and the error surfaced.
    expect(upload?.success).toBe(true);
    expect(upload?.simulated).toBe(true);
    expect(upload?.message).toBe("Failed to fetch");
  });
});
