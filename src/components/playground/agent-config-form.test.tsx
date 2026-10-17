import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentConfigForm } from "@/components/playground/AgentConfigForm";
import { DEFAULT_AGENT_A } from "@/lib/catalog";

const shared = { available: {}, onChange: () => {} };

describe("Agent config form", () => {
  it("offers the speech pickers for a voice flow", () => {
    render(<AgentConfigForm config={DEFAULT_AGENT_A} {...shared} />);
    expect(screen.getByText("Speech to text")).toBeInTheDocument();
    expect(screen.getByText("Voice model")).toBeInTheDocument();
    expect(screen.getByText("Voice")).toBeInTheDocument();
  });

  it("hides the speech pickers when the caller types and replies stay unspoken", () => {
    render(<AgentConfigForm config={DEFAULT_AGENT_A} {...shared} showStt={false} showTts={false} />);
    expect(screen.queryByText("Speech to text")).not.toBeInTheDocument();
    expect(screen.queryByText("Voice model")).not.toBeInTheDocument();
    expect(screen.queryByText("Voice")).not.toBeInTheDocument();
    expect(screen.getByText("AI model")).toBeInTheDocument();
    expect(screen.getByText("Scenario")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("keeps the voice pickers when typed replies are spoken", () => {
    render(<AgentConfigForm config={DEFAULT_AGENT_A} {...shared} showStt={false} showTts />);
    expect(screen.queryByText("Speech to text")).not.toBeInTheDocument();
    expect(screen.getByText("Voice model")).toBeInTheDocument();
    expect(screen.getByText("Voice")).toBeInTheDocument();
  });
});
