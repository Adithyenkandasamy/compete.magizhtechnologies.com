import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CircularHudLoader } from "@/components/loading";

describe("CircularHudLoader", () => {
  it("renders the default login message", () => {
    render(<CircularHudLoader />);
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });

  it("renders logout mode copy", () => {
    render(<CircularHudLoader mode="logout" />);
    expect(screen.getByText("Signing out...")).toBeInTheDocument();
  });

  it("renders session mode copy", () => {
    render(<CircularHudLoader mode="session" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("overrides the label with a custom message", () => {
    render(<CircularHudLoader message="Verifying credentials..." />);
    expect(screen.getByText("Verifying credentials...")).toBeInTheDocument();
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

  it("renders a full-screen overlay when fullScreen is set", () => {
    const { container } = render(<CircularHudLoader fullScreen />);
    const hud = container.querySelector('[data-testid="circular-hud"]');
    expect(hud).toHaveClass("fixed", "inset-0");
  });

  it("stays inline (no fixed overlay) when fullScreen is omitted", () => {
    const { container } = render(<CircularHudLoader />);
    const hud = container.querySelector('[data-testid="circular-hud"]');
    expect(hud).not.toHaveClass("fixed");
  });

  it("renders a clean spinner without fake percentages", () => {
    const { container } = render(<CircularHudLoader mode="logout" />);
    expect(container.textContent).not.toMatch(/\d+%/);
  });
});