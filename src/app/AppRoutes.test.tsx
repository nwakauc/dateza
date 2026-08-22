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
});
