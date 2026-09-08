import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HackerSnakeLoader } from "@/components/loading";

describe("HackerSnakeLoader", () => {
  it("renders a contextual message", () => {
    render(<HackerSnakeLoader message="SCANNING EVENTS" />);
    expect(screen.getByText("SCANNING EVENTS")).toBeInTheDocument();
  });

  it("does not render a message when omitted", () => {
    const { container } = render(<HackerSnakeLoader size="md" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("announces an accessible pending state by default", () => {
    const { container } = render(<HackerSnakeLoader message="LOADING" />);
    expect(container.querySelector("[role='status']")).toBeInTheDocument();
    expect(
      container.querySelector("[aria-busy='true']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[aria-live='polite']"),
    ).toBeInTheDocument();
  });

  it("renders a decorative (aria-hidden) marker when announce is false", () => {
    const { container } = render(
      <HackerSnakeLoader announce={false} size="sm" />,
    );
    const element = container.querySelector('[data-testid="hacker-snake"]');
    expect(element).toHaveAttribute("aria-hidden", "true");
    expect(element).not.toHaveAttribute("role", "status");
  });

  it("renders exactly one snake (no duplicate loaders)", () => {
    const { container } = render(<HackerSnakeLoader message="LOADING" />);
    expect(
      container.querySelectorAll('[data-testid="hacker-snake"]'),
    ).toHaveLength(1);
  });

  it("applies sm size without a tall container (for buttons/inline)", () => {
    const { container } = render(<HackerSnakeLoader size="sm" />);
    expect(container.firstChild).not.toHaveClass("min-h-[30vh]");
    expect(container.querySelector(".magizh-snake-track")).toHaveClass("w-12");
  });

  it("applies lg size with preserved section height and a reticle", () => {
    const { container } = render(<HackerSnakeLoader size="lg" />);
    expect(container.firstChild).toHaveClass("min-h-[30vh]");
    expect(container.querySelector(".magizh-snake-ticks")).toBeInTheDocument();
  });

  it("respects reduced motion: static indication remains", () => {
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

    const { container } = render(<HackerSnakeLoader message="LOADING" />);

    // The message and accessible status survive even when motion is disabled.
    expect(container.querySelector("[role='status']")).toBeInTheDocument();
    expect(screen.getByText("LOADING")).toBeInTheDocument();
    expect(container.querySelector(".magizh-snake-track")).toBeInTheDocument();
  });
});