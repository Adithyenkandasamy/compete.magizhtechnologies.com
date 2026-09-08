import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import LoginPage from "@/app/login/page";
import { PageLoader, RefetchIndicator } from "@/components/loading";

/**
 * System behavior tests for the Magizh two-loader language:
 *
 *   Circular HUD → authentication only
 *   Hacker Snake → every other loading state
 *
 * No third loader (spinner / dots / shimmer) may ever be introduced.
 */

const authMock = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children?: ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    user: null,
    status: "unauthenticated",
    isAuthenticated: false,
    login: authMock.login,
    register: authMock.register,
    logout: authMock.logout,
  }),
}));

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

describe("Loading system: Circular HUD vs Hacker Snake", () => {
  it("shows the Circular HUD while authenticating and never a snake", async () => {
    // Keep the auth request pending so the loading UI stays visible.
    authMock.login.mockReturnValue(new Promise(() => {}));

    const { container } = renderLogin();

    expect(
      container.querySelector('[data-testid="circular-hud"]'),
    ).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "admin@magizh.io");
    await user.type(screen.getByLabelText(/password/i), "Secret123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      container.querySelector('[data-testid="circular-hud"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="hacker-snake"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".animate-spin"),
    ).not.toBeInTheDocument();
  });

  it("does not show the Circular HUD for ordinary API operations", () => {
    const { container } = render(<RefetchIndicator active label="Updating" />);

    expect(
      container.querySelector('[data-testid="hacker-snake"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="circular-hud"]'),
    ).not.toBeInTheDocument();
  });

  it("uses the Hacker Snake for page/data loading", () => {
    const { container } = render(
      <PageLoader variant="page" label="loading dashboard" />,
    );

    expect(
      container.querySelector('[data-testid="hacker-snake"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="circular-hud"]'),
    ).not.toBeInTheDocument();
  });

  it("renders exactly one loader per loading state (no duplicates)", () => {
    const { container } = render(
      <PageLoader variant="page" label="loading dashboard" />,
    );

    expect(
      container.querySelectorAll('[data-testid="hacker-snake"]'),
    ).toHaveLength(1);
  });

  it("never renders a third loader icon across the loading families", () => {
    const { container } = render(<PageLoader label="loading" />);

    expect(
      container.querySelector(".animate-spin"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".magizh-pulse-dot"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".magizh-loader-line"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".magizh-skeleton"),
    ).not.toBeInTheDocument();
  });
});