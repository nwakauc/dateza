import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App.tsx";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("SPA routes", () => {
  it("renders the existing landing experience at /", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /girls are waiting/i })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("link", { name: /^how it works$/i })).toHaveAttribute("href", "/how-it-works");
  });

  it("keeps marketing hashes on the landing page", () => {
    renderAt("/#discover");

    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /page not found/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an accessible Not Found page for unknown paths", () => {
    renderAt("/this-route-does-not-exist");

    expect(
      screen.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toHaveAttribute("href", "/");
  });

  it("returns to the landing page from Not Found", async () => {
    const user = userEvent.setup();
    renderAt("/this-route-does-not-exist");

    await user.click(screen.getByRole("link", { name: /back to home/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
  });

  it.each([
    ["/how-it-works", /create a profile/i],
    ["/dating-safely", /date like you have somewhere/i],
    ["/stories", /the point is a real date/i],
    ["/lifestyle", /dates that look like this country/i],
    ["/privacy", /your dating life stays yours/i],
    ["/help", /how to get going/i],
    ["/careers", /building dateza/i],
    ["/cities", /across sa/i],
    ["/get-the-app", /ready in your browser/i],
  ] as const)("renders the public %s page", (path, heading) => {
    renderAt(path);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join dateza free/i })).toHaveAttribute("href", "/sign-up");
  });
});
