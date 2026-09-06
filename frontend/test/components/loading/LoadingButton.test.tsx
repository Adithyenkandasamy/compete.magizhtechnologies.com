import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoadingButton } from "@/components/loading";

describe("LoadingButton", () => {
  it("renders children when not loading", () => {
    render(<LoadingButton>Register</LoadingButton>);
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("shows loading text and becomes disabled during a mutation", () => {
    render(<LoadingButton loading loadingText="Registering...">Register</LoadingButton>);

    const button = screen.getByRole("button", { name: /registering/i });
    expect(button).toBeDisabled();
    expect(screen.queryByText("Register")).not.toBeInTheDocument();
  });

  it("flags aria-busy while pending", () => {
    render(<LoadingButton loading>Save</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("is enabled and not busy when idle", () => {
    render(<LoadingButton>Save</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("prevents double-clicks while pending", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <LoadingButton loading loadingText="Submitting..." onClick={onClick}>
        Submit
      </LoadingButton>,
    );

    const button = screen.getByRole("button");
    await user.click(button).catch(() => {});

    // Disabled buttons do not fire click handlers — this is the
    // double-submit protection.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards explicit disabled prop", () => {
    render(<LoadingButton disabled>Submit</LoadingButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders the pulse dot indicator while loading (not motion-only)", () => {
    const { container } = render(<LoadingButton loading>Save</LoadingButton>);
    expect(container.querySelector(".magizh-pulse-dot")).toBeInTheDocument();
  });
});
