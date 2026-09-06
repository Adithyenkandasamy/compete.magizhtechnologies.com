import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/loading";

describe("Skeleton", () => {
  it("renders a single skeleton block with magizh-skeleton class", () => {
    const { container } = render(<Skeleton />);
    const element = container.querySelector(".magizh-skeleton");
    expect(element).toBeInTheDocument();
  });

  it("applies additional className", () => {
    const { container } = render(<Skeleton className="h-10 w-24" />);
    expect(container.firstChild).toHaveClass("h-10 w-24 magizh-skeleton");
  });

  it("is hidden from assistive technology (decoration only)", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SkeletonText", () => {
  it("renders the requested number of lines", () => {
    const { container } = render(<SkeletonText lines={4} />);
    expect(container.querySelectorAll(".magizh-skeleton")).toHaveLength(4);
  });

  it("makes the last line shorter to mimic a paragraph", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll(".magizh-skeleton");
    expect(lines[2]).toHaveClass("w-3/5");
    expect(lines[0]).not.toHaveClass("w-3/5");
  });

  it("renders a single default line when lines is omitted", () => {
    const { container } = render(<SkeletonText />);
    expect(container.querySelectorAll(".magizh-skeleton")).toHaveLength(3);
  });
});

describe("SkeletonCircle", () => {
  it("renders a circular skeleton", () => {
    const { container } = render(<SkeletonCircle size={40} />);
    expect(container.firstChild).toHaveClass("magizh-skeleton rounded-full");
  });

  it("applies the given pixel size via inline style", () => {
    const { container } = render(<SkeletonCircle size={64} />);
    expect(container.firstChild).toHaveStyle({ width: "64px", height: "64px" });
  });
});
