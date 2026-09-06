import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageLoader, BlockLoader } from "@/components/loading";

describe("PageLoader", () => {
  it("renders the MAGIZH wordmark", () => {
    render(<PageLoader />);
    expect(screen.getByText("MAGIZH")).toBeInTheDocument();
  });

  it("renders the default loading label", () => {
    render(<PageLoader />);
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    render(<PageLoader label="loading events" />);
    expect(screen.getByText("loading events")).toBeInTheDocument();
  });

  it("announces pending state to assistive tech", () => {
    const { container } = render(<PageLoader />);
    expect(container.querySelector("[role='status']")).toBeInTheDocument();
    expect(
      container.querySelector("[aria-busy='true']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[aria-live='polite']"),
    ).toBeInTheDocument();
  });

  it("applies the page variant's min-height by default", () => {
    const { container } = render(<PageLoader />);
    expect(container.firstChild).toHaveClass("min-h-[60vh]");
  });

  it("applies the section variant min-height", () => {
    const { container } = render(<PageLoader variant="section" />);
    expect(container.firstChild).toHaveClass("min-h-[30vh]");
  });
});

describe("BlockLoader", () => {
  it("renders the requested number of block cards", () => {
    const { container } = render(<BlockLoader count={2} />);
    // each card contains the border shell + inner skeleton lines
    const cards = container.querySelectorAll(".overflow-hidden");
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("defaults to three blocks", () => {
    const { container } = render(<BlockLoader />);
    const cards = container.querySelectorAll(".overflow-hidden");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it("is marked decorative (aria-hidden)", () => {
    const { container } = render(<BlockLoader />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
