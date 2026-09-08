import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingOverlay } from "@/components/loading";

describe("LoadingOverlay", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<LoadingOverlay open={false} />);
    expect(
      container.querySelector('[data-testid="loading-overlay"]'),
    ).not.toBeInTheDocument();
  });

  it("renders the Circular HUD for the hud variant (auth)", () => {
    const { container } = render(
      <LoadingOverlay open variant="hud" message="AUTHENTICATING" />,
    );
    expect(
      container.querySelector('[data-testid="circular-hud"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="hacker-snake"]'),
    ).not.toBeInTheDocument();
  });

  it("renders the Hacker Snake for the default (non-auth) variant", () => {
    const { container } = render(
      <LoadingOverlay open message="SYNCING COMMAND CENTER" />,
    );
    expect(
      container.querySelector('[data-testid="hacker-snake"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="circular-hud"]'),
    ).not.toBeInTheDocument();
  });

  it("marks the overlay as busy for assistive tech", () => {
    const { container } = render(<LoadingOverlay open />);
    expect(
      container.querySelector('[data-testid="loading-overlay"]'),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("never renders a third loader", () => {
    const { container } = render(
      <LoadingOverlay open variant="snake" message="LOADING" />,
    );
    expect(
      container.querySelector(".animate-spin"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".magizh-pulse-dot"),
    ).not.toBeInTheDocument();
  });
});