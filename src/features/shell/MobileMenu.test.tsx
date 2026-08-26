import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "../session/SessionProvider.tsx";
import { MobileHeader } from "./MobileHeader.tsx";
import type { OwnAccount } from "./OwnAccountContext.ts";

const account: OwnAccount = {
  loading: false,
  profile: null,
  onboarding: null,
  avatarUrl: null,
  photoCount: 0,
  displayName: "Naledi",
  initial: "N",
  unreadNotifications: 0,
  refresh: () => undefined,
};

describe("mobile menu", () => {
  it("opens destinations that are otherwise buried on a phone", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/discover"]}>
        <SessionProvider>
          <MobileHeader account={account} />
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("link", { name: /^settings$/i })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /safety centre/i })).toHaveAttribute("href", "/settings/safety");
    expect(screen.getByRole("link", { name: /edit profile/i })).toHaveAttribute("href", "/profile/edit");
    expect(screen.getByRole("link", { name: /^find$/i })).toHaveAttribute("href", "/find");
  });
});
