import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api/errors.ts";
import * as openerApi from "../../lib/api/opener.ts";
import { OpenerChooser } from "../opener/OpenerChooser.tsx";
import { IncomingOpener } from "../opener/IncomingOpener.tsx";
import { OpenerWaiting } from "../opener/OpenerWaiting.tsx";
import { OpenerSurface } from "../opener/OpenerSurface.tsx";
import { MemoryRouter } from "react-router-dom";

const catalogue = [
  { key: "coffee_or_tea", text: "Coffee or tea — what's your usual?" },
  { key: "weekend_plans", text: "What does your perfect weekend look like?" },
  { key: "last_watched", text: "What did you last watch that you loved?" },
  { key: "hidden_talent", text: "What's a hidden talent you're quietly proud of?" },
];

describe("D8N Opener", () => {
  it("renders backend catalogue keys and never hard-codes those strings in the chooser source", () => {
    render(<OpenerChooser profileId="p1" name="Maya" catalogue={catalogue} onSent={() => undefined} />);
    expect(screen.getByText("Coffee or tea — what's your usual?")).toBeInTheDocument();
    expect(screen.queryByText("hidden_talent")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^send opener$/i })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /coffee or tea/i })).toBeChecked();
  });

  it("sends the selected opener_key and transitions on success", async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    vi.spyOn(openerApi, "sendOpener").mockResolvedValue({
      opener: { id: "o1", status: "pending", created_at: "2026-08-26T00:00:00Z", expires_at: "2026-08-28T00:00:00Z" },
    });
    render(<OpenerChooser profileId="p1" name="Maya" catalogue={catalogue} onSent={onSent} />);
    await user.click(screen.getByText("Coffee or tea — what's your usual?"));
    const send = screen.getByRole("button", { name: /^send opener$/i });
    expect(send).toBeEnabled();
    await user.click(send);
    await user.click(send);
    expect(openerApi.sendOpener).toHaveBeenCalledTimes(1);
    expect(openerApi.sendOpener).toHaveBeenCalledWith("p1", "coffee_or_tea");
    expect(onSent).toHaveBeenCalledWith("Coffee or tea — what's your usual?", "2026-08-28T00:00:00Z");
  });

  it("keeps the selection and does not call onSent when send fails", async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    vi.spyOn(openerApi, "sendOpener").mockRejectedValue(new ApiError(409, "already_hooked", "conflict"));
    render(<OpenerChooser profileId="p1" name="Maya" catalogue={catalogue} onSent={onSent} />);
    await user.click(screen.getByText("Coffee or tea — what's your usual?"));
    await user.click(screen.getByRole("button", { name: /^send opener$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already sent/i);
    expect(onSent).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: /coffee or tea/i })).toBeChecked();
    expect(screen.getByRole("button", { name: /^send opener$/i })).toBeDisabled();
  });

  it("waiting state has no composer and shows the sent opener text", () => {
    render(<OpenerWaiting name="Maya" sentText="Coffee or tea — what's your usual?" />);
    expect(screen.getByText(/opener sent/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for maya/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("does not invent opener lines when D8N returns an empty catalogue", () => {
    render(
      <MemoryRouter>
        <OpenerSurface
          profileId="p1"
          name="Maya"
          catalogue={[]}
          openerState="available"
          onSent={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/openers aren’t available yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send opener$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("offers retry only when the catalogue request failed", () => {
    const onRetry = vi.fn();
    render(
      <MemoryRouter>
        <OpenerSurface
          profileId="p1"
          name="Maya"
          catalogue={[]}
          catalogueFailed
          openerState="available"
          onSent={() => undefined}
          onRetryCatalogue={onRetry}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/couldn’t load opener lines/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("incoming opener can reply and decline, keeping typed reply on failure", async () => {
    const user = userEvent.setup();
    vi.spyOn(openerApi, "replyToOpener").mockRejectedValue(new ApiError(422, "message_too_long", "too long"));
    render(
      <MemoryRouter>
        <IncomingOpener
          opener={{
            id: "o1",
            message: "Coffee or tea — what's your usual?",
            created_at: "2026-08-26T00:00:00Z",
            expires_at: "2026-08-28T00:00:00Z",
            sender: {
              id: "s1",
              display_name: "Lerato",
              age: 28,
              bio: null,
              gender: null,
              pronouns: null,
              country_code: null,
              city: null,
              occupation: null,
              job_title: null,
              school_or_institution: null,
              looking_for_text: null,
              height_cm: null,
              body_type: null,
              languages_spoken: [],
              smoking: null,
              drinking: null,
              fitness: null,
              photos: [],
              options: {},
            },
            }}
          onResolved={() => undefined}
          onReplied={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /^lerato$/i })).toBeInTheDocument();
    const field = screen.getByLabelText(/your reply/i);
    await user.type(field, "Tea, always.");
    await user.click(screen.getByRole("button", { name: /^reply$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too long/i);
    expect(field).toHaveValue("Tea, always.");
  });

  it("does not remove an incoming opener when decline fails", async () => {
    const user = userEvent.setup();
    const onResolved = vi.fn();
    vi.spyOn(openerApi, "declineOpener").mockRejectedValue(new ApiError(404, "hook_unavailable", "gone"));
    render(
      <MemoryRouter>
        <IncomingOpener
          opener={{
            id: "o1",
            message: "Coffee or tea — what's your usual?",
            created_at: "2026-08-26T00:00:00Z",
            expires_at: "2026-08-28T00:00:00Z",
            sender: {
              id: "s1",
              display_name: "Lerato",
              age: 28,
              bio: null,
              gender: null,
              pronouns: null,
              country_code: null,
              city: null,
              occupation: null,
              job_title: null,
              school_or_institution: null,
              looking_for_text: null,
              height_cm: null,
              body_type: null,
              languages_spoken: [],
              smoking: null,
              drinking: null,
              fitness: null,
              photos: [],
              options: {},
            },
          }}
          onResolved={onResolved}
          onReplied={() => undefined}
        />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: /not interested/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onResolved).not.toHaveBeenCalled();
  });

  it("does not offer a chooser when D8N opener_state is unavailable or pending", () => {
    const { rerender } = render(
      <MemoryRouter>
        <OpenerSurface
          profileId="p1"
          name="Maya"
          catalogue={catalogue}
          openerState="unavailable"
          onSent={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/an opener isn’t available for this person/i)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send opener$/i })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <OpenerSurface
          profileId="p1"
          name="Maya"
          catalogue={catalogue}
          openerState="pending"
          onSent={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/opener sent/i)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("promotes a reply into the returned conversation without a second client state machine", async () => {
    const user = userEvent.setup();
    const onReplied = vi.fn();
    const onResolved = vi.fn();
    vi.spyOn(openerApi, "replyToOpener").mockResolvedValue({
      conversation: {
        id: "c1",
        match_id: "m1",
        status: "active",
        created_at: "2026-08-26T00:00:00Z",
        profile: {
          id: "s1",
          display_name: "Lerato",
          age: 28,
          bio: null,
          gender: null,
          pronouns: null,
          country_code: null,
          city: null,
          occupation: null,
          job_title: null,
          school_or_institution: null,
          looking_for_text: null,
          height_cm: null,
          body_type: null,
          languages_spoken: [],
          smoking: null,
          drinking: null,
          fitness: null,
          photos: [],
          options: {},
        },
        last_message: null,
      },
      message: {
        id: "msg-1",
        conversation_id: "c1",
        sender_id: "viewer",
        body: "Tea, always.",
        created_at: "2026-08-26T00:01:00Z",
      },
    });
    render(
      <MemoryRouter>
        <IncomingOpener
          opener={{
            id: "o1",
            message: "Coffee or tea — what's your usual?",
            created_at: "2026-08-26T00:00:00Z",
            expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            sender: {
              id: "s1",
              display_name: "Lerato",
              age: 28,
              bio: null,
              gender: null,
              pronouns: null,
              country_code: null,
              city: null,
              occupation: null,
              job_title: null,
              school_or_institution: null,
              looking_for_text: null,
              height_cm: null,
              body_type: null,
              languages_spoken: [],
              smoking: null,
              drinking: null,
              fitness: null,
              photos: [],
              options: {},
            },
          }}
          onResolved={onResolved}
          onReplied={onReplied}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/expires/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/your reply/i), "Tea, always.");
    await user.click(screen.getByRole("button", { name: /^reply$/i }));
    await waitFor(() => expect(onReplied).toHaveBeenCalledTimes(1));
    expect(onResolved).not.toHaveBeenCalled();
    expect(onReplied.mock.calls[0]?.[0]).toBe("o1");
    expect(onReplied.mock.calls[0]?.[1]).toMatchObject({
      id: "c1",
      match_id: "m1",
      last_message: { body: "Tea, always." },
    });
  });
});
