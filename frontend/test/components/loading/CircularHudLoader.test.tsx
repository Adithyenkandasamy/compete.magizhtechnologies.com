import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CircularHudLoader } from "@/components/loading";

describe("CircularHudLoader", () => {
  it("renders a default authentication message", () => {
    render(<CircularHudLoader />);
    expect(screen.getByText("AUTHENTICATING")).toBeInTheDocument();
  });

  it("renders a custom message", () => {
    render(<CircularHudLoader message="VERIFYING IDENTITY" />);
    expect(screen.getByText("VERIFYING IDENTITY")).toBeInTheDocument();
  });

  it("announces an accessible pending state", () => {
    const { container } = render(<CircularHudLoader />);
    expect(container.querySelector("[role='status']")).toBeInTheDocument();
    expect(
      container.querySelector("[aria-busy='true']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[aria-live='polite']"),
    ).toBeInTheDocument();
  });

  it("renders a black full-screen overlay when fullScreen is set", () => {
    const { container } = render(<CircularHudLoader fullScreen />);
    const hud = container.querySelector('[data-testid="circular-hud"]');
    expect(hud).toHaveClass("fixed", "inset-0", "bg-black");
  });

  it("stays inline (no fixed overlay) when fullScreen is omitted", () => {
    const { container } = render(<CircularHudLoader />);
    const hud = container.querySelector('[data-testid="circular-hud"]');
    expect(hud).not.toHaveClass("fixed");
  });

  it("preserves a static indication under reduced motion", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    render(<CircularHudLoader message="TERMINATING SESSION" />);

    // Even with motion disabled the HUD keeps announcing the pending state.
    expect(screen.getByText("TERMINATING SESSION")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});