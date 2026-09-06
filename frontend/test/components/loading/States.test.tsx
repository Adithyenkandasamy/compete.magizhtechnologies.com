import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  EventCardSkeleton,
  ErrorState,
  EmptyState,
  RefetchIndicator,
} from "@/components/loading";

describe("Loading / Error / Empty state distinction", () => {
  it("EventCardSkeleton is distinct from Error and Success (decorative)", () => {
    const { container } = render(<EventCardSkeleton count={2} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ErrorState renders an announced alert, not a loading skeleton", () => {
    render(
      <ErrorState title="Unable to load events." onRetry={() => {}} />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Unable to load events.")).toBeInTheDocument();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
  });

  it("EmptyState indicates zero results but is NOT an error or loader", () => {
    render(<EmptyState title="No upcoming hackathons yet." />);
    expect(screen.getByText("No upcoming hackathons yet.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders a default title when none given", () => {
    render(<ErrorState />);
    expect(screen.getByText("Unable to load this content.")).toBeInTheDocument();
  });

  it("renders an optional message", () => {
    render(<ErrorState message="The backend may be offline." />);
    expect(screen.getByText("The backend may be offline.")).toBeInTheDocument();
  });

  it("does not render a retry button when onRetry is omitted", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRetry when the retry action is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("RefetchIndicator", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(<RefetchIndicator active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows a subtle updating indicator when a background refetch is active", () => {
    render(<RefetchIndicator active />);
    expect(screen.getByText(/updating/i)).toBeInTheDocument();
    expect(screen.getByText(/updating/i)).not.toHaveClass(
      "magizh-skeleton",
    );
  });

  it("renders a custom label", () => {
    render(<RefetchIndicator active label="Refreshing" />);
    expect(screen.getByText("Refreshing")).toBeInTheDocument();
  });

  it("announces the update via aria-live", () => {
    const { container } = render(<RefetchIndicator active />);
    expect(container.querySelector("[aria-live='polite']")).toBeInTheDocument();
  });
});
