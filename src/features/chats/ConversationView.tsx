import { type ChangeEvent, type FormEvent, type KeyboardEvent, type RefObject, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ChatMediaKind } from "../../lib/api/chatMediaTypes.ts";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { Conversation, Message } from "../../lib/api/socialTypes.ts";
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
import { matchDate, messageTime } from "./chatDisplay.ts";
import { MessageMedia } from "./MessageMedia.tsx";

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
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const attachWrapRef = useRef<HTMLDivElement>(null);
  const attachPanelRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef<string>();
  const attachMenuId = useId();
  const [attachOpen, setAttachOpen] = useState(false);
  const conversationId = conversation?.id;

  useEffect(() => {
    if (!conversation || messagesLoading || messagesError || pendingMedia) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (activeConversationRef.current !== conversation.id) {
      activeConversationRef.current = conversation.id;
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [conversation, messagesLoading, messagesError, messages.length, pendingMedia]);

  useEffect(() => {
    setAttachOpen(false);
  }, [conversationId, pendingMedia]);

  useEffect(() => {
    if (!attachOpen) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (attachWrapRef.current?.contains(target) || attachPanelRef.current?.contains(target)) return;
      setAttachOpen(false);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setAttachOpen(false);
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
  const active = conversation.status === "active";
  const staging = Boolean(pendingMedia);
  const canSend =
    active &&
    !sending &&
    pendingMedia?.phase !== "uploading" &&
    pendingMedia?.phase !== "failed" &&
    (draft.trim().length > 0 || pendingMedia?.phase === "ready");
  const attachDisabled = !active || sending || staging;

  async function loadOlder() {
    const scroller = scrollerRef.current;
    const previousHeight = scroller?.scrollHeight ?? 0;
    await onLoadOlder();
    window.requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop += scroller.scrollHeight - previousHeight;
    });
  }

  function handlePick(kind: ChatMediaKind, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPickMedia(kind, file);
  }

  function openPicker(pick: AttachPick) {
    setAttachOpen(false);
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

      {staging && pendingMedia ? (
        <ChatMediaStage pending={pendingMedia} onCancel={onCancelMedia} onRetry={onRetryMedia} />
      ) : (
        <>
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
              const mediaOnly = message.body.trim().length === 0 && message.attachments.length > 0;
              return (
                <article
                  className={`message-bubble${own ? " message-bubble--own" : ""}${mediaOnly ? " message-bubble--media" : ""}`}
                  key={message.id}
                >
                  <MessageMedia
                    message={message}
                    counterpartName={name}
                    canDelete={own && active}
                    canReport={!own}
                    onDelete={onDeleteAttachment}
                    deletingAttachmentId={deletingAttachmentId}
                  />
                  <time dateTime={message.created_at}>{messageTime(message.created_at)}</time>
                </article>
              );
            }) : null}
          </div>
        </>
      )}

      {!active ? <p className="chat-composer__closed">This conversation is closed.</p> : null}
      {sendError ? <p className="chat-composer__error" role="alert">Your message wasn’t sent. Your draft is still here — try again.</p> : null}
      {mediaUnavailable ? <p className="chat-composer__error" role="alert">Photos and videos in chat aren’t available yet.</p> : null}
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
                onClick={() => setAttachOpen((open) => !open)}
              >
                <PlusIcon className="chat-composer__attach-icon chat-composer__attach-icon--plus" />
                <PaperclipIcon className="chat-composer__attach-icon chat-composer__attach-icon--clip" />
              </button>
            </div>
          )}
          <label className="sr-only" htmlFor={`chat-message-${conversation.id}`}>Message {name}</label>
          <textarea
            id={`chat-message-${conversation.id}`}
            name="message"
            rows={1}
            maxLength={2000}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={submitComposerOnEnter}
            placeholder={staging ? "Add a caption…" : `Message ${name}…`}
            autoComplete="off"
            enterKeyHint="send"
            disabled={!active || sending}
          />
          <button className="chat-composer__send" type="submit" aria-label="Send message" disabled={!canSend}>
            <PaperPlaneIcon />
            <span>{sending ? "Sending…" : "Send"}</span>
          </button>
        </div>
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
