import { type ChangeEvent, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ChatMediaKind } from "../../lib/api/chatMediaTypes.ts";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { Conversation, Message, MessageReplyTo } from "../../lib/api/socialTypes.ts";
import { ProfileSafetyActions } from "../profile/ProfileSafetyActions.tsx";
import {
  CameraIcon,
  ChatIcon,
  ChevronLeftIcon,
  CloseIcon,
  GalleryIcon,
  PaperclipIcon,
  PaperPlaneIcon,
  PlusIcon,
  ShieldCheckIcon,
  VideoIcon,
} from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { conversationCanCompose, conversationIsEnded, matchDate, messageTime } from "./chatDisplay.ts";
import { MessageMedia } from "./MessageMedia.tsx";

const OLDER_SCROLL_PX = 72;
const NEAR_BOTTOM_PX = 80;
const LONG_PRESS_MS = 450;

function quoteAuthor(senderId: string, ownerProfileId: string | undefined, counterpartName: string): string {
  return senderId === ownerProfileId ? "You" : counterpartName;
}

function quoteExcerpt(reply: Pick<MessageReplyTo, "message_type" | "body_excerpt">): string {
  if (reply.message_type === "media") return reply.body_excerpt?.trim() || "Photo or video";
  return reply.body_excerpt?.trim() || "Message";
}

function MessageQuote({
  reply,
  counterpartName,
  ownerProfileId,
  onLocate,
}: {
  reply: MessageReplyTo;
  counterpartName: string;
  ownerProfileId?: string;
  onLocate: (id: string) => void;
}) {
  const author = quoteAuthor(reply.sender_id, ownerProfileId, counterpartName);
  const body = (
    <>
      <strong>{author}</strong>
      <span>{quoteExcerpt(reply)}</span>
    </>
  );
  if (reply.deleted) {
    return (
      <div className="message-quote message-quote--gone">
        <strong>{author}</strong>
        <span>{quoteExcerpt(reply)}</span>
        <em>Original is no longer available</em>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="message-quote"
      onClick={() => onLocate(reply.id)}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={`View original from ${author}`}
    >
      {body}
    </button>
  );
}

function ComposerReplyPreview({
  message,
  counterpartName,
  ownerProfileId,
  onCancel,
}: {
  message: Message;
  counterpartName: string;
  ownerProfileId?: string;
  onCancel: () => void;
}) {
  const author = quoteAuthor(message.sender_id, ownerProfileId, counterpartName);
  const excerpt = message.body.trim() || (message.attachments.some((item) => !item.deleted) ? "Photo or video" : "Message");
  return (
    <div className="chat-reply-preview">
      <p>
        <strong>Replying to {author}</strong>
        <span>{excerpt}</span>
      </p>
      <button type="button" aria-label="Cancel reply" onClick={onCancel}>
        <CloseIcon />
      </button>
    </div>
  );
}

export type PendingChatMedia = {
  kind: ChatMediaKind;
  fileName: string;
  previewUrl: string;
  phase: "uploading" | "ready" | "failed";
  progress: number;
  error?: string;
};

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
  pendingMedia?: PendingChatMedia;
  mediaUnavailable: boolean;
  deletingAttachmentId?: string;
  onDraft: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onPickMedia: (kind: ChatMediaKind, file: File) => void;
  onCancelMedia: () => void;
  onRetryMedia: () => void;
  onDeleteAttachment: (messageId: string, attachmentId: string) => void;
  onBack: () => void;
  onRetryMessages: () => void;
  onLoadOlder: () => Promise<void>;
  onBlocked: () => void;
  onUnmatched?: () => void;
  replyTo?: Message;
  onReply: (message: Message) => void;
  onCancelReply: () => void;
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

type AttachPick = "photo" | "camera" | "video";

function ChatAttachMenu({
  id,
  panelRef,
  onPick,
}: {
  id: string;
  panelRef: RefObject<HTMLDivElement>;
  onPick: (pick: AttachPick) => void;
}) {
  return (
    <div className="chat-attach" id={id} ref={panelRef} role="menu" aria-label="Attach">
      <button className="chat-attach__item" type="button" role="menuitem" onClick={() => onPick("photo")}>
        <span className="chat-attach__icon chat-attach__icon--photo">
          <GalleryIcon />
        </span>
        <span>Photo</span>
      </button>
      <button className="chat-attach__item chat-attach__item--camera" type="button" role="menuitem" onClick={() => onPick("camera")}>
        <span className="chat-attach__icon chat-attach__icon--camera">
          <CameraIcon />
        </span>
        <span>Camera</span>
      </button>
      <button className="chat-attach__item" type="button" role="menuitem" onClick={() => onPick("video")}>
        <span className="chat-attach__icon chat-attach__icon--video">
          <VideoIcon />
        </span>
        <span>Video</span>
      </button>
    </div>
  );
}

function ChatMediaStage({
  pending,
  onCancel,
  onRetry,
}: {
  pending: PendingChatMedia;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const failed = pending.phase === "failed";
  const uploading = pending.phase === "uploading";
  return (
    <div className="chat-media-stage">
      <button className="chat-media-stage__close" type="button" aria-label="Remove attachment" onClick={onCancel}>
        <CloseIcon />
      </button>
      <div className="chat-media-stage__frame">
        {pending.kind === "image" ? (
          <img src={pending.previewUrl} alt="" />
        ) : (
          <video src={pending.previewUrl} controls muted playsInline />
        )}
        {uploading ? (
          <div className="chat-media-stage__status" role="status">
            <span>
              {pending.progress > 0 ? `Uploading ${Math.round(pending.progress * 100)}%` : "Uploading…"}
            </span>
          </div>
        ) : null}
        {failed ? (
          <div className="chat-media-stage__status chat-media-stage__status--failed" role="alert">
            <span>{pending.error ?? "Couldn’t upload"}</span>
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ChatEmptyState({ hasConversations }: { hasConversations: boolean }) {
  if (hasConversations) {
    return (
      <div className="chat-empty">
        <span><ChatIcon /></span>
        <h2>Your conversations live here</h2>
        <p>Choose someone from your chats and keep getting to know them.</p>
      </div>
    );
  }

  return (
    <div className="chat-empty chat-empty--companion">
      <span><ChatIcon /></span>
      <h2>Waiting for a chat</h2>
      <p>When you start talking, the conversation opens here.</p>
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
  pendingMedia,
  mediaUnavailable,
  deletingAttachmentId,
  onDraft,
  onSend,
  onPickMedia,
  onCancelMedia,
  onRetryMedia,
  onDeleteAttachment,
  onBack,
  onRetryMessages,
  onLoadOlder,
  onBlocked,
  onUnmatched,
  replyTo,
  onReply,
  onCancelReply,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const attachWrapRef = useRef<HTMLDivElement>(null);
  const attachPanelRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const activeConversationRef = useRef<string>();
  const pinnedNewestRef = useRef(false);
  const restoreFromBottomRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number>();
  const longPressOriginRef = useRef<{ x: number; y: number }>();
  const attachMenuId = useId();
  const [attachForConversationId, setAttachForConversationId] = useState<string | undefined>();
  const [locatedId, setLocatedId] = useState<string>();
  const [newMessagesAvailable, setNewMessagesAvailable] = useState(false);
  const newestIdRef = useRef<string>();
  const conversationId = conversation?.id;
  const attachOpen = conversationId !== undefined && attachForConversationId === conversationId && !pendingMedia;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const fromBottom = restoreFromBottomRef.current;
    if (!scroller || fromBottom == null) return;
    scroller.style.scrollBehavior = "auto";
    scroller.scrollTop = scroller.scrollHeight - fromBottom;
    scroller.style.scrollBehavior = "";
    restoreFromBottomRef.current = null;
  }, [messages]);

  useLayoutEffect(() => {
    if (!conversation || messagesLoading || messagesError) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const newestId = messages[0]?.id;

    if (activeConversationRef.current !== conversation.id) {
      activeConversationRef.current = conversation.id;
      newestIdRef.current = newestId;
      scroller.style.scrollBehavior = "auto";
      scroller.scrollTop = scroller.scrollHeight;
      scroller.style.scrollBehavior = "";
      pinnedNewestRef.current = true;
      setNewMessagesAvailable(false);
      return;
    }

    const previousNewest = newestIdRef.current;
    newestIdRef.current = newestId;
    if (!newestId || newestId === previousNewest || previousNewest == null) return;

    if (pinnedNewestRef.current) {
      scroller.style.scrollBehavior = "auto";
      scroller.scrollTop = scroller.scrollHeight;
      scroller.style.scrollBehavior = "";
      setNewMessagesAvailable(false);
    } else {
      setNewMessagesAvailable(true);
    }
  }, [conversation, messages, messagesLoading, messagesError]);

  useEffect(() => {
    if (!locatedId) return;
    const timeout = window.setTimeout(() => setLocatedId(undefined), 1600);
    return () => window.clearTimeout(timeout);
  }, [locatedId]);

  useEffect(() => {
    if (!attachOpen) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (attachWrapRef.current?.contains(target) || attachPanelRef.current?.contains(target)) return;
      setAttachForConversationId(undefined);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setAttachForConversationId(undefined);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [attachOpen]);

  if (!conversation) return null;

  const name = conversation.profile.display_name || "DateZA member";
  const returnTo = `/chats?conversation=${encodeURIComponent(conversation.id)}`;
  const chronological = [...messages].reverse();
  const ended = conversationIsEnded(conversation);
  const canCompose = conversationCanCompose(conversation);
  const staging = Boolean(pendingMedia);
  const canSend =
    canCompose &&
    !sending &&
    pendingMedia?.phase !== "uploading" &&
    pendingMedia?.phase !== "failed" &&
    (draft.trim().length > 0 || pendingMedia?.phase === "ready");
  const attachDisabled = !canCompose || sending || staging;
  const historyPreview = ended && !messagesLoading && !messagesError && messages.length === 0 ? conversation.last_message : null;

  async function loadOlder() {
    const scroller = scrollerRef.current;
    if (scroller) restoreFromBottomRef.current = scroller.scrollHeight - scroller.scrollTop;
    try {
      await onLoadOlder();
    } catch {
      restoreFromBottomRef.current = null;
    }
  }

  function jumpToLatest() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.style.scrollBehavior = "smooth";
    scroller.scrollTop = scroller.scrollHeight;
    scroller.style.scrollBehavior = "";
    pinnedNewestRef.current = true;
    setNewMessagesAvailable(false);
  }

  function onThreadScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const fromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    pinnedNewestRef.current = fromBottom < NEAR_BOTTOM_PX;
    if (pinnedNewestRef.current) setNewMessagesAvailable(false);
    if (!nextCursor || loadingOlder) return;
    if (scroller.scrollTop > OLDER_SCROLL_PX) return;
    void loadOlder();
  }

  function locateOriginal(id: string) {
    const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(id) : id;
    const node = scrollerRef.current?.querySelector(`[data-message-id="${escaped}"]`);
    if (!(node instanceof HTMLElement)) return;
    node.scrollIntoView({ block: "center", behavior: "smooth" });
    setLocatedId(id);
  }

  function startReply(message: Message) {
    if (!canCompose) return;
    onReply(message);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  function onBubblePointerDown(event: ReactPointerEvent<HTMLElement>, message: Message) {
    if (!canCompose || event.pointerType === "mouse") return;
    longPressOriginRef.current = { x: event.clientX, y: event.clientY };
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => startReply(message), LONG_PRESS_MS);
  }

  function onBubblePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const origin = longPressOriginRef.current;
    if (!origin) return;
    if (Math.abs(event.clientX - origin.x) > 10 || Math.abs(event.clientY - origin.y) > 10) {
      window.clearTimeout(longPressTimerRef.current);
      longPressOriginRef.current = undefined;
    }
  }

  function clearLongPress() {
    window.clearTimeout(longPressTimerRef.current);
    longPressOriginRef.current = undefined;
  }

  function handlePick(kind: ChatMediaKind, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPickMedia(kind, file);
  }

  function openPicker(pick: AttachPick) {
    setAttachForConversationId(undefined);
    if (pick === "camera") cameraInputRef.current?.click();
    else if (pick === "photo") photoInputRef.current?.click();
    else videoInputRef.current?.click();
  }

  return (
    <div className={`chat-view${staging ? " chat-view--staging" : ""}`}>
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
              {ended
                ? "This match has ended"
                : !canCompose
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
          matchId={canCompose ? conversation.match_id : undefined}
          conversationId={conversation.id}
          onBlocked={onBlocked}
          onUnmatched={onUnmatched}
        />
      </header>

      {staging && pendingMedia ? (
        <ChatMediaStage pending={pendingMedia} onCancel={onCancelMedia} onRetry={onRetryMedia} />
      ) : (
        <>
          {matchedAt && canCompose ? (
            <div className="chat-match-context">
              <span aria-hidden="true">♥</span>
              <p><strong>You matched on {matchDate(matchedAt)}</strong><small>Keep discovering what makes this connection yours.</small></p>
            </div>
          ) : null}

          <div className="chat-thread-wrap">
          <div className="message-thread" ref={scrollerRef} aria-live="polite" onScroll={onThreadScroll}>
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
            {!messagesLoading && !messagesError && messages.length === 0 && !ended ? (
              <div className="chat-inline-state">
                <span className="chat-inline-state__heart" aria-hidden="true">♥</span>
                <strong>Start with something genuine</strong>
                <p>Ask about the detail that made you want to know them better.</p>
              </div>
            ) : null}
            {historyPreview ? (
              <article className="message-bubble">
                {historyPreview.body.trim() ? <p>{historyPreview.body}</p> : null}
                <time dateTime={historyPreview.created_at}>{messageTime(historyPreview.created_at)}</time>
              </article>
            ) : null}
            {!messagesLoading && !messagesError ? chronological.map((message) => {
              const own = message.sender_id === ownerProfileId;
              const mediaOnly = message.body.trim().length === 0 && message.attachments.length > 0;
              return (
                <article
                  className={`message-bubble${own ? " message-bubble--own" : ""}${mediaOnly ? " message-bubble--media" : ""}${locatedId === message.id ? " message-bubble--located" : ""}`}
                  key={message.id}
                  data-message-id={message.id}
                  onPointerDown={(event) => onBubblePointerDown(event, message)}
                  onPointerMove={onBubblePointerMove}
                  onPointerUp={clearLongPress}
                  onPointerCancel={clearLongPress}
                >
                  {message.reply_to ? (
                    <MessageQuote
                      reply={message.reply_to}
                      counterpartName={name}
                      ownerProfileId={ownerProfileId}
                      onLocate={locateOriginal}
                    />
                  ) : null}
                  <MessageMedia
                    message={message}
                    counterpartName={name}
                    canDelete={own && canCompose}
                    canReport={!own}
                    canReply={canCompose}
                    onReply={startReply}
                    onDelete={onDeleteAttachment}
                    deletingAttachmentId={deletingAttachmentId}
                  />
                  <time dateTime={message.created_at}>{messageTime(message.created_at)}</time>
                </article>
              );
            }) : null}
          </div>
          {newMessagesAvailable ? (
            <button className="message-thread__latest" type="button" onClick={jumpToLatest}>
              New messages ↓
            </button>
          ) : null}
          </div>
        </>
      )}

      {ended ? <p className="chat-composer__closed">This match has ended.</p> : null}
      {!ended && !canCompose ? <p className="chat-composer__closed">This conversation is closed.</p> : null}
      {sendError ? <p className="chat-composer__error" role="alert">Your message wasn’t sent. Your draft is still here — try again.</p> : null}
      {mediaUnavailable ? <p className="chat-composer__error" role="alert">Photos and videos in chat aren’t available yet.</p> : null}
      {canCompose ? (
      <form className={`chat-composer${attachOpen ? " chat-composer--attach-open" : ""}`} onSubmit={onSend}>
        <input
          ref={photoInputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={(event) => handlePick("image", event)}
          disabled={attachDisabled}
        />
        <input
          ref={cameraInputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          capture="environment"
          onChange={(event) => handlePick("image", event)}
          disabled={attachDisabled}
        />
        <input
          ref={videoInputRef}
          className="sr-only"
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          onChange={(event) => handlePick("video", event)}
          disabled={attachDisabled}
        />
        {attachOpen ? <ChatAttachMenu id={attachMenuId} panelRef={attachPanelRef} onPick={openPicker} /> : null}
        {replyTo ? (
          <ComposerReplyPreview
            message={replyTo}
            counterpartName={name}
            ownerProfileId={ownerProfileId}
            onCancel={onCancelReply}
          />
        ) : null}
        <div className="chat-composer__bar">
          {staging ? null : (
            <div className="chat-composer__attach-wrap" ref={attachWrapRef}>
              <button
                className={`chat-composer__attach${attachOpen ? " chat-composer__attach--open" : ""}`}
                type="button"
                aria-label={attachOpen ? "Close attach" : "Attach photo or video"}
                aria-expanded={attachOpen}
                aria-controls={attachOpen ? attachMenuId : undefined}
                aria-haspopup="menu"
                disabled={attachDisabled}
                onClick={() =>
                  setAttachForConversationId((current) => (current === conversation.id ? undefined : conversation.id))
                }
              >
                <PlusIcon className="chat-composer__attach-icon chat-composer__attach-icon--plus" />
                <PaperclipIcon className="chat-composer__attach-icon chat-composer__attach-icon--clip" />
              </button>
            </div>
          )}
          <label className="sr-only" htmlFor={`chat-message-${conversation.id}`}>Message {name}</label>
          <textarea
            id={`chat-message-${conversation.id}`}
            ref={composerRef}
            name="message"
            rows={1}
            maxLength={2000}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={submitComposerOnEnter}
            placeholder={staging ? "Add a caption…" : replyTo ? "Write a reply…" : `Message ${name}…`}
            autoComplete="off"
            enterKeyHint="send"
            disabled={sending}
          />
          <button className="chat-composer__send" type="submit" aria-label="Send message" disabled={!canSend}>
            <PaperPlaneIcon />
            <span>{sending ? "Sending…" : "Send"}</span>
          </button>
        </div>
      </form>
      ) : null}
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
