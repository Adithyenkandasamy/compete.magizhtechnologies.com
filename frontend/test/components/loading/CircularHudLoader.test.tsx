import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CircularHudLoader } from "@/components/loading";

describe("CircularHudLoader", () => {
  it("renders the default login banner", () => {
    render(<CircularHudLoader />);
    expect(screen.getByText("AUTHENTICATING...")).toBeInTheDocument();
  });

  it("renders the login stage labels by default", () => {
    render(<CircularHudLoader />);
    expect(screen.getByText("CONNECTING TO CORE")).toBeInTheDocument();
    expect(screen.getByText("VERIFYING CREDENTIALS")).toBeInTheDocument();
    expect(
      screen.getByText("ESTABLISHING SECURE SESSION"),
    ).toBeInTheDocument();
  });

  it("renders logout mode copy", () => {
    render(<CircularHudLoader mode="logout" />);
    expect(screen.getByText("SIGNING OUT...")).toBeInTheDocument();
    expect(screen.getByText("TERMINATING SESSION")).toBeInTheDocument();
    expect(screen.getByText("CLOSING SECURE CHANNEL")).toBeInTheDocument();
    expect(screen.getByText("CLEARING SESSION STATE")).toBeInTheDocument();
  });

  it("renders session mode copy", () => {
    render(<CircularHudLoader mode="session" />);
    expect(screen.getByText("VERIFYING SESSION...")).toBeInTheDocument();
    expect(screen.getByText("VERIFYING SESSION")).toBeInTheDocument();
    expect(screen.getByText("RESTORING IDENTITY")).toBeInTheDocument();
    expect(screen.getByText("CHECKING ACCESS")).toBeInTheDocument();
  });

  it("overrides the banner with a custom message", () => {
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

  it("renders exactly one Circular HUD (no third loader hidden inside)", () => {
    const { container } = render(<CircularHudLoader fullScreen />);
    expect(
      container.querySelectorAll('[data-testid="circular-hud"]'),
    ).toHaveLength(1);
    expect(
      container.querySelector('[data-testid="hacker-snake"]'),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("never shows a fake progress percentage", () => {
    const { container } = render(<CircularHudLoader mode="logout" />);
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it("keeps decorative stage/numerals noise out of the accessible tree", () => {
    const { container } = render(<CircularHudLoader />);
    const stages = container.querySelector(".magizh-hud-stages");
    expect(stages).toHaveAttribute("aria-hidden", "true");
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

    render(<CircularHudLoader mode="logout" />);

    // Even with motion disabled the HUD keeps announcing the pending state.
    expect(screen.getByText("SIGNING OUT...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});