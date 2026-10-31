import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LiveEvent } from "@/hooks/use-live-voice";

const mock = vi.hoisted(() => ({
  options: null as null | { onEvent: (event: LiveEvent) => Promise<void> },
  start: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("@/hooks/use-live-voice", () => ({
  useLiveVoice: (options: typeof mock.options) => {
    mock.options = options;
    return {
      status: "idle",
      audioRef: { current: null },
      start: mock.start,
      stop: mock.stop,
      error: null,
    };
  },
}));
import { FloVoice } from "./FloVoice";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("Mira unified spoken conversation", () => {
  it("publishes caller and assistant captions to the shared transcript as they arrive", async () => {
    const onCaptions = vi.fn();
    render(
      <FloVoice
        visitorId="visitor_1234567890"
        onActive={vi.fn()}
        onMessages={vi.fn()}
        onCaptions={onCaptions}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Talk to Mira" }));
    await act(async () => {
      await mock.options?.onEvent({ type: "session.input_transcript.delta", delta: "Where is " });
      await mock.options?.onEvent({ type: "session.input_transcript.delta", delta: "Aura?" });
      await mock.options?.onEvent({
        type: "session.output_transcript.delta",
        delta: "In Hyderabad.",
      });
    });
    const latest = onCaptions.mock.lastCall?.[0];
    expect(latest).toHaveLength(2);
    expect(latest[0].parts).toEqual([{ type: "text", text: "Where is Aura?" }]);
    expect(latest[1].parts).toEqual([{ type: "text", text: "In Hyderabad." }]);
  });
  it("replaces captions with saved history only after successful finalization", async () => {
    const history = [
      { id: "saved", role: "assistant", parts: [{ type: "text", text: "Saved reply" }] },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: history }))),
    );
    const onCaptions = vi.fn(),
      onMessages = vi.fn(),
      onActive = vi.fn();
    render(
      <FloVoice
        visitorId="visitor_1234567890"
        onActive={onActive}
        onMessages={onMessages}
        onCaptions={onCaptions}
      />,
    );
    await act(async () => {
      await mock.options?.onEvent({ type: "app.closed", finalized: true });
    });
    expect(onMessages).toHaveBeenCalledWith(history);
    expect(onCaptions).toHaveBeenCalledWith([]);
    expect(onActive).toHaveBeenCalledWith(false);
  });
  it("retains spoken captions when the server did not finalize the call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [] }))),
    );
    const onCaptions = vi.fn(),
      onMessages = vi.fn(),
      onActive = vi.fn();
    render(
      <FloVoice
        visitorId="visitor_1234567890"
        onActive={onActive}
        onMessages={onMessages}
        onCaptions={onCaptions}
      />,
    );
    await act(async () => {
      await mock.options?.onEvent({ type: "app.closed", finalized: false });
    });
    expect(onMessages).not.toHaveBeenCalled();
    expect(onCaptions).not.toHaveBeenCalled();
    expect(onActive).toHaveBeenCalledWith(false);
  });
});
