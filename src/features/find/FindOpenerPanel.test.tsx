import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DATEZA_OPENER_SUPPORTED, OpenerUnavailableError, sendOpener } from "../../lib/api/opener.ts";
import { FindOpenerPanel } from "./FindOpenerPanel.tsx";

describe("DateZA opener boundary", () => {
  it("does not claim opener is supported and never resolves a send", async () => {
    expect(DATEZA_OPENER_SUPPORTED).toBe(false);
    await expect(sendOpener("p1", "Hi")).rejects.toBeInstanceOf(OpenerUnavailableError);
  });

  it("keeps composer copy on an unavailable send", async () => {
    const user = userEvent.setup();
    render(<FindOpenerPanel profileId="p1" name="Maya" view="compose" onSent={() => undefined} />);
    await user.type(screen.getByLabelText(/opener message/i), "Hello from Sea Point");
    await user.click(screen.getByRole("button", { name: /^send opener$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/aren’t on DateZA|aren't on DateZA/i);
    expect(screen.getByLabelText(/opener message/i)).toHaveValue("Hello from Sea Point");
  });

  it("renders waiting and unlocked states without calling a network", () => {
    const { rerender } = render(<FindOpenerPanel profileId="p1" name="Maya" view="waiting" onSent={() => undefined} />);
    expect(screen.getByText(/your opener was sent/i)).toBeInTheDocument();
    rerender(<FindOpenerPanel profileId="p1" name="Maya" view="unlocked" onSent={() => undefined} />);
    expect(screen.getByText(/conversation unlocked/i)).toBeInTheDocument();
  });
});
