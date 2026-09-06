import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableSkeleton, DashboardSkeleton } from "@/components/loading";

describe("TableSkeleton", () => {
  it("renders the configured number of rows and columns of skeleton cells", () => {
    const { container } = render(<TableSkeleton rows={4} columns={3} />);

    const headerCells = container.querySelectorAll("thead th");
    const bodyRows = container.querySelectorAll("tbody tr");
    const bodyCells = container.querySelectorAll("tbody td");

    expect(headerCells).toHaveLength(3);
    expect(bodyRows).toHaveLength(4);
    expect(bodyCells).toHaveLength(12);
  });

  it("defaults to 6 rows and 5 columns", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(6);
    expect(container.querySelectorAll("thead th")).toHaveLength(5);
    expect(container.querySelectorAll("tbody td")).toHaveLength(30);
  });

  it("is decorative (aria-hidden)", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("DashboardSkeleton", () => {
  it("renders the student default of 3 stat cards", () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelectorAll(".h-32")).toHaveLength(3);
  });

  it("renders the admin variant with 6 stat cards", () => {
    const { container } = render(<DashboardSkeleton variant="admin" />);
    expect(container.querySelectorAll(".h-32")).toHaveLength(6);
  });

  it("honors an explicit statItems override", () => {
    const { container } = render(
      <DashboardSkeleton variant="student" statItems={5} />,
    );
    expect(container.querySelectorAll(".h-32")).toHaveLength(5);
  });

  it("renders a header foundation so it visually matches a dashboard", () => {
    const { container } = render(<DashboardSkeleton />);
    // header has a skeleton line for the kicker and a big heading block
    expect(container.querySelectorAll(".magizh-skeleton").length).toBeGreaterThan(0);
  });

  it("is decorative (aria-hidden)", () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
