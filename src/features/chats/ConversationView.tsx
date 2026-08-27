import { type FormEvent, type KeyboardEvent, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { Conversation, Message } from "../../lib/api/socialTypes.ts";
import { ProfileSafetyActions } from "../profile/ProfileSafetyActions.tsx";
import { ChatIcon, ChevronLeftIcon, PaperPlaneIcon, ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { matchDate, messageTime } from "./chatDisplay.ts";

type Props = {
  conversation?: Conversation;
  profile?: ProfileDetail;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: boolean;
  nextCursor: string | null;
  loadingOlder: boolean;
  ownerProfileId?: string;
  matchedAt?: string;
  draft: string;
  sending: boolean;
  sendError: boolean;
  onDraft: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onBack: () => void;
  onRetryMessages: () => void;
  onLoadOlder: () => Promise<void>;
  onBlocked: () => void;
  onUnmatched?: () => void;
};

function MemberAvatar({ conversation, name }: { conversation: Conversation; name: string }) {
  const photo = conversation.profile.photos[0];
  return photo ? <img src={photo.url} width="48" height="48" alt="" /> : <span aria-hidden="true">{name[0]?.toUpperCase()}</span>;
}

function submitComposerOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}

export function ChatEmptyState({ hasConversations }: { hasConversations: boolean }) {
  return (
    <div className="chat-empty">
      <span><ChatIcon /></span>
      <h2>{hasConversations ? "Your conversations live here" : "No conversations yet"}</h2>
      <p>
        {hasConversations
          ? "Choose someone from your chats and keep getting to know them."
          : "A match is only the beginning. Your conversations will grow here."}
      </p>
      {!hasConversations ? (
        <div><Link to="/discover">Discover people</Link><Link to="/likes">Go to Likes</Link></div>
      ) : null}
    </div>
  );
}

export function ConversationView({
  conversation,
  profile,
  messages,
  messagesLoading,
  messagesError,
  nextCursor,
  loadingOlder,
  ownerProfileId,
  matchedAt,
  draft,
  sending,
  sendError,
  onDraft,
  onSend,
  onBack,
  onRetryMessages,
  onLoadOlder,
  onBlocked,
  onUnmatched,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef<string>();

  useEffect(() => {
    if (!conversation || messagesLoading || messagesError) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (activeConversationRef.current !== conversation.id) {
      activeConversationRef.current = conversation.id;
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [conversation, messagesLoading, messagesError, messages.length]);

  if (!conversation) return null;

  const name = conversation.profile.display_name || "DateZA member";
  const returnTo = `/chats?conversation=${encodeURIComponent(conversation.id)}`;
  const chronological = [...messages].reverse();
  const active = conversation.status === "active";

  async function loadOlder() {
    const scroller = scrollerRef.current;
    const previousHeight = scroller?.scrollHeight ?? 0;
    await onLoadOlder();
    window.requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop += scroller.scrollHeight - previousHeight;
    });
  }

  return (
    <div className="chat-view">
      <header className="chat-header">
        <button className="chat-header__back" type="button" aria-label="Back to conversations" onClick={onBack}>
          <ChevronLeftIcon />
        </button>
        <Link className="chat-header__person" to={`/profile/${conversation.profile.id}`} state={{ from: "chats", returnTo }}>
          <MemberAvatar conversation={conversation} name={name} />
          <span>
            <strong>
              {name}
              {profile?.verified ? <i title={VERIFIED_CONTACT_LABEL}><ShieldCheckIcon /></i> : null}
            </strong>
            <small>
              {!active
                ? "Conversation closed"
                : profile?.online
                  ? "Online now"
                  : profile?.active_today
                    ? "Active today"
                    : "DateZA connection"}
            </small>
          </span>
        </Link>
        <ProfileSafetyActions
          profileId={conversation.profile.id}
          name={name}
          matchId={active ? conversation.match_id : undefined}
          onBlocked={onBlocked}
          onUnmatched={onUnmatched}
        />
      </header>

      {matchedAt ? (
        <div className="chat-match-context">
          <span aria-hidden="true">♥</span>
          <p><strong>You matched on {matchDate(matchedAt)}</strong><small>Keep discovering what makes this connection yours.</small></p>
        </div>
      ) : null}

      <div className="message-thread" ref={scrollerRef} aria-live="polite">
        {messagesLoading ? <MessageSkeleton /> : null}
        {messagesError ? (
          <div className="chat-inline-state">
            <ChatIcon />
            <strong>Messages didn’t load</strong>
            <p>Your conversation is safe. Check your connection and try again.</p>
            <button type="button" onClick={onRetryMessages}>Try again</button>
          </div>
        ) : null}
        {!messagesLoading && !messagesError && nextCursor ? (
          <button className="message-thread__older" type="button" onClick={() => void loadOlder()} disabled={loadingOlder}>
            {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
          </button>
        ) : null}
        {!messagesLoading && !messagesError && messages.length === 0 ? (
          <div className="chat-inline-state">
            <span className="chat-inline-state__heart" aria-hidden="true">♥</span>
            <strong>Start with something genuine</strong>
            <p>Ask about the detail that made you want to know them better.</p>
          </div>
        ) : null}
        {!messagesLoading && !messagesError ? chronological.map((message) => {
          const own = message.sender_id === ownerProfileId;
          return (
            <article className={`message-bubble${own ? " message-bubble--own" : ""}`} key={message.id}>
              <p>{message.body}</p>
              <time dateTime={message.created_at}>{messageTime(message.created_at)}</time>
            </article>
          );
        }) : null}
      </div>

      {!active ? <p className="chat-composer__closed">This conversation is closed.</p> : null}
      {sendError ? <p className="chat-composer__error" role="alert">Your message wasn’t sent. Your draft is still here — try again.</p> : null}
      <form className="chat-composer" onSubmit={onSend}>
        <label className="sr-only" htmlFor={`chat-message-${conversation.id}`}>Message {name}</label>
        <textarea
          id={`chat-message-${conversation.id}`}
          name="message"
          rows={1}
          maxLength={2000}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={submitComposerOnEnter}
          placeholder={`Message ${name}…`}
          autoComplete="off"
          enterKeyHint="send"
          disabled={!active || sending}
        />
        <button type="submit" aria-label="Send message" disabled={!draft.trim() || sending || !active}>
          <PaperPlaneIcon />
          <span>{sending ? "Sending…" : "Send"}</span>
        </button>
      </form>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="message-skeleton" aria-label="Loading messages" aria-busy="true">
      <span /><span /><span /><span />
    </div>
  );
}
