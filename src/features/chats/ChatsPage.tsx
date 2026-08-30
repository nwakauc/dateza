import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { chatMediaUnavailable, deleteMessageAttachment } from "../../lib/api/chatMedia.ts";
import type { ChatMediaKind } from "../../lib/api/chatMediaTypes.ts";
import { getProfileDetail } from "../../lib/api/find.ts";
import { listReceivedOpeners } from "../../lib/api/opener.ts";
import type { ReceivedOpener } from "../../lib/api/openerTypes.ts";
import { listConversations, listMatches, listMessages, sendMessage } from "../../lib/api/social.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { Conversation, Match, Message } from "../../lib/api/socialTypes.ts";
import { ChatIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { chatMediaErrorMessage, uploadChatMedia } from "./chatMediaActions.ts";
import { ChatProfileRail } from "./ChatProfileRail.tsx";
import { useLiveSync } from "../liveSync/LiveSyncContext.ts";
import { mergeConversationSnapshot, mergeNewestMessagePage, mergeOpenerSnapshot } from "../liveSync/mergeLiveSnapshots.ts";
import { conversationCanCompose, mergeById, replaceConversationPreview, upsertConversation } from "./chatDisplay.ts";
import { ConversationList } from "./ConversationList.tsx";
import { ChatEmptyState, ConversationView, type PendingChatMedia } from "./ConversationView.tsx";

export default function ChatsPage() {
  const account = useOwnAccount();
  const liveSync = useLiveSync();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [openers, setOpeners] = useState<ReceivedOpener[]>([]);
  const [openerCursor, setOpenerCursor] = useState<string | null>(null);
  const [openersError, setOpenersError] = useState(false);
  const [loadingMoreOpeners, setLoadingMoreOpeners] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const sendingRef = useRef(false);
  const [loadedConversationId, setLoadedConversationId] = useState<string>();
  const [messageErrorId, setMessageErrorId] = useState<string>();
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingChatMedia>();
  const [mediaUnavailable, setMediaUnavailable] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string>();
  const mediaFileRef = useRef<File>();
  const mediaSignedIdRef = useRef<string>();
  const mediaKindRef = useRef<ChatMediaKind>();
  const mediaAbortRef = useRef<AbortController>();
  const [profile, setProfile] = useState<ProfileDetail>();
  const [loadedProfileId, setLoadedProfileId] = useState<string>();
  const [profileErrorId, setProfileErrorId] = useState<string>();
  const [replyTo, setReplyTo] = useState<Message>();
  const selectedId = params.get("conversation");
  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId],
  );
  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selected?.match_id),
    [matches, selected?.match_id],
  );
  const selectedProfileId = selected?.profile.id;

  const load = useCallback((wantedConversationId?: string | null) => {
    void Promise.allSettled([listConversations(), listReceivedOpeners(), listMatches()])
      .then(async ([conversationResult, openerResult, matchResult]) => {
        if (conversationResult.status === "rejected") {
          setError(true);
          return;
        }
        let conversations = conversationResult.value.conversations;
        let cursor = conversationResult.value.next_cursor;
        while (wantedConversationId && !conversations.some((item) => item.id === wantedConversationId) && cursor) {
          try {
            const next = await listConversations(cursor);
            conversations = mergeById(conversations, next.conversations);
            cursor = next.next_cursor;
          } catch {
            cursor = null;
          }
        }
        setConversations(conversations);
        setConversationCursor(cursor);
        if (openerResult.status === "fulfilled") {
          setOpeners(openerResult.value.openers);
          setOpenerCursor(openerResult.value.next_cursor);
          setOpenersError(false);
        } else {
          setOpeners([]);
          setOpenerCursor(null);
          setOpenersError(true);
        }
        setMatches(matchResult.status === "fulfilled" ? matchResult.value.matches : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback((conversationId: string, ended = false) => {
    return listMessages(conversationId)
      .then((result) => {
        setMessages(result.messages);
        setMessageCursor(result.next_cursor);
        setLoadedConversationId(conversationId);
        setMessageErrorId(undefined);
      })
      .catch(() => {
        setMessages([]);
        setMessageCursor(null);
        setMessageErrorId(ended ? undefined : conversationId);
        setLoadedConversationId(conversationId);
      });
  }, []);

  const loadProfile = useCallback((profileId: string) => {
    return getProfileDetail(profileId)
      .then((result) => {
        setProfile(result.profile);
        setLoadedProfileId(profileId);
        setProfileErrorId(undefined);
      })
      .catch(() => {
        setProfile(undefined);
        setProfileErrorId(profileId);
      });
  }, []);

  const wantedConversationOnLoad = useRef(selectedId);

  useEffect(() => {
    document.title = "Chats — DateZA";
    load(wantedConversationOnLoad.current);
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [load]);

  useEffect(() => {
    if (!selectedId || !selectedProfileId) return;
    void Promise.all([loadMessages(selectedId, selected?.relationship_state === "ended"), loadProfile(selectedProfileId)]);
  }, [selectedId, selectedProfileId, selected?.relationship_state, loadMessages, loadProfile]);

  useEffect(() => {
    if (!liveSync) return;
    return liveSync.subscribeChatsInbox((snapshot) => {
      setConversations((current) => mergeConversationSnapshot(current, snapshot.conversations));
      if (snapshot.openers) {
        setOpeners((current) => mergeOpenerSnapshot(current, snapshot.openers ?? []));
        setOpenersError(false);
      } else if (snapshot.openersError) {
        setOpenersError(true);
      }
      if (snapshot.matches) setMatches(snapshot.matches);
    });
  }, [liveSync]);

  const liveThreadReady = Boolean(selectedId && loadedConversationId === selectedId);

  useEffect(() => {
    if (!liveSync || !selectedId) return;
    void liveSync.acknowledgeConversationRead(selectedId);
  }, [liveSync, selectedId]);

  useEffect(() => {
    if (!liveSync) return;
    liveSync.setActiveConversation(liveThreadReady ? selectedId : null);
    return () => liveSync.setActiveConversation(null);
  }, [liveSync, liveThreadReady, selectedId]);

  useEffect(() => {
    if (!liveSync) return;
    return liveSync.subscribeMessages((conversationId, newestPage) => {
      if (conversationId !== selectedId) return;
      setMessages((current) => mergeNewestMessagePage(current, newestPage).messages);
    });
  }, [liveSync, selectedId]);

  function retry() {
    setLoading(true);
    setError(false);
    load(selectedId);
  }

  function clearPendingMedia() {
    mediaAbortRef.current?.abort();
    mediaAbortRef.current = undefined;
    mediaSignedIdRef.current = undefined;
    mediaKindRef.current = undefined;
    mediaFileRef.current = undefined;
    setPendingMedia((current) => {
      if (current?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(current.previewUrl);
      return undefined;
    });
  }

  async function startMediaUpload(conversationId: string, file: File, kind: ChatMediaKind, previewUrl: string) {
    mediaAbortRef.current?.abort();
    const abort = new AbortController();
    mediaAbortRef.current = abort;
    mediaFileRef.current = file;
    mediaSignedIdRef.current = undefined;
    mediaKindRef.current = undefined;
    setPendingMedia({ kind, fileName: file.name, previewUrl, phase: "uploading", progress: 0 });
    try {
      const result = await uploadChatMedia(conversationId, file, kind, {
        signal: abort.signal,
        onProgress: (loaded, total) => {
          setPendingMedia((current) =>
            current ? { ...current, progress: total > 0 ? loaded / total : current.progress } : current,
          );
        },
      });
      if (abort.signal.aborted) return;
      mediaSignedIdRef.current = result.signedId;
      mediaKindRef.current = kind;
      setPendingMedia((current) => (current ? { ...current, phase: "ready", progress: 1 } : current));
    } catch (error) {
      if (abort.signal.aborted) return;
      if (chatMediaUnavailable(error)) setMediaUnavailable(true);
      setPendingMedia((current) =>
        current ? { ...current, phase: "failed", error: chatMediaErrorMessage(error, kind) } : current,
      );
    }
  }

  function pickMedia(kind: ChatMediaKind, file: File) {
    if (!selected || !conversationCanCompose(selected)) return;
    setMediaUnavailable(false);
    setPendingMedia((current) => {
      if (current?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(current.previewUrl);
      return undefined;
    });
    void startMediaUpload(selected.id, file, kind, URL.createObjectURL(file));
  }

  function retryMedia() {
    const file = mediaFileRef.current;
    if (!selected || !file || !pendingMedia) return;
    const previewUrl = pendingMedia.previewUrl;
    void startMediaUpload(selected.id, file, pendingMedia.kind, previewUrl);
  }

  function selectConversation(id: string) {
    setDraft("");
    setSendError(false);
    setMediaUnavailable(false);
    setReplyTo(undefined);
    clearPendingMedia();
    setParams({ conversation: id });
  }

  function retryMessages(conversationId: string) {
    setMessageErrorId(undefined);
    setLoadedConversationId(undefined);
    void loadMessages(conversationId);
  }

  function retryProfile(profileId: string) {
    setProfileErrorId(undefined);
    setLoadedProfileId(undefined);
    void loadProfile(profileId);
  }

  async function loadMoreConversations() {
    if (!conversationCursor || loadingMoreConversations) return;
    setLoadingMoreConversations(true);
    try {
      const result = await listConversations(conversationCursor);
      setConversations((current) => mergeById(current, result.conversations));
      setConversationCursor(result.next_cursor);
    } catch {
      setConversationCursor(null);
    } finally {
      setLoadingMoreConversations(false);
    }
  }

  async function loadMoreOpeners() {
    if (!openerCursor || loadingMoreOpeners) return;
    setLoadingMoreOpeners(true);
    try {
      const result = await listReceivedOpeners(openerCursor);
      setOpeners((current) => mergeById(current, result.openers));
      setOpenerCursor(result.next_cursor);
    } catch {
      setOpenersError(true);
    } finally {
      setLoadingMoreOpeners(false);
    }
  }

  function handleOpenerReplied(openerId: string, conversation: Conversation) {
    setOpeners((current) => current.filter((item) => item.id !== openerId));
    setConversations((current) => upsertConversation(current, conversation));
    void listMatches()
      .then((result) => setMatches(result.matches))
      .catch(() => undefined);
  }

  async function loadOlderMessages() {
    if (!selected || !messageCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const result = await listMessages(selected.id, messageCursor);
      setMessages((current) => mergeById(current, result.messages));
      setMessageCursor(result.next_cursor);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    const signedId = mediaSignedIdRef.current;
    const mediaKind = mediaKindRef.current;
    if (!selected || sendingRef.current) return;
    if (!conversationCanCompose(selected)) return;
    if (pendingMedia?.phase === "uploading" || pendingMedia?.phase === "failed") return;
    if (!body && !(signedId && mediaKind)) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(false);
    try {
      const message = await sendMessage(selected.id, {
        ...(body ? { body } : {}),
        ...(signedId && mediaKind
          ? { attachment_uploads: [{ signed_id: signedId, media_kind: mediaKind }] }
          : {}),
        ...(replyTo ? { reply_to_message_id: replyTo.id } : {}),
      });
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [message, ...current]));
      setConversations((current) => replaceConversationPreview(current, selected.id, message));
      setDraft("");
      setReplyTo(undefined);
      clearPendingMedia();
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.code === "invalid_reply_target") setReplyTo(undefined);
      setSendError(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function handleDeleteAttachment(messageId: string, attachmentId: string) {
    if (!selected) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await deleteMessageAttachment(selected.id, messageId, attachmentId);
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                attachments: item.attachments.map((attachment) =>
                  attachment.id === attachmentId
                    ? { ...attachment, deleted: true, display: null, poster: null, download: null }
                    : attachment,
                ),
              }
            : item,
        ),
      );
    } catch {
      /* keep the attachment visible */
    } finally {
      setDeletingAttachmentId(undefined);
    }
  }

  function removeSelectedConversation() {
    if (!selected) return;
    setConversations((current) => current.filter((conversation) => conversation.id !== selected.id));
    setParams({});
  }

  function handleUnmatched() {
    if (!selected) return;
    const matchId = selected.match_id;
    setMatches((current) => current.filter((match) => match.id !== matchId));
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selected.id ? { ...conversation, relationship_state: "ended" } : conversation,
      ),
    );
    setReplyTo(undefined);
    clearPendingMedia();
  }

  if (error) {
    return (
      <div className="shell-page shell-page--chats">
        <div className="shell-empty">
          <ChatIcon className="shell-empty__icon" />
          <p className="shell-empty__title">Chats didn’t load</p>
          <p className="shell-empty__body">Check your connection, then try again.</p>
          <button className="shell-primary-action" type="button" onClick={retry}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-page shell-page--chats">
      <div className={`chats-layout${selected || selectedId ? " chats-layout--selected" : ""}`}>
        <ConversationList
          conversations={conversations}
          openers={openers}
          selectedId={selectedId}
          loading={loading}
          loadingMore={loadingMoreConversations}
          hasMore={conversationCursor !== null}
          openersError={openersError}
          loadingMoreOpeners={loadingMoreOpeners}
          openersHasMore={openerCursor !== null}
          onSelect={selectConversation}
          onLoadMore={() => void loadMoreConversations()}
          onLoadMoreOpeners={() => void loadMoreOpeners()}
          onRetryOpeners={() => {
            setOpenersError(false);
            void listReceivedOpeners()
              .then((result) => {
                setOpeners(result.openers);
                setOpenerCursor(result.next_cursor);
              })
              .catch(() => setOpenersError(true));
          }}
          onOpenersChanged={() => load(selectedId)}
          onOpenerReplied={handleOpenerReplied}
        />
        <section className="chats-detail" aria-label={selected ? `Chat with ${selected.profile.display_name || "member"}` : "Selected conversation"}>
          {selected ? (
            <ConversationView
              conversation={selected}
              profile={loadedProfileId === selected.profile.id ? profile : undefined}
              messages={messages}
              messagesLoading={loadedConversationId !== selected.id}
              messagesError={messageErrorId === selected.id}
              nextCursor={messageCursor}
              loadingOlder={loadingOlder}
              ownerProfileId={account.profile?.id}
              matchedAt={selectedMatch?.matched_at}
              draft={draft}
              sending={sending}
              sendError={sendError}
              pendingMedia={pendingMedia}
              mediaUnavailable={mediaUnavailable}
              deletingAttachmentId={deletingAttachmentId}
              onDraft={setDraft}
              onSend={(event) => void submit(event)}
              onPickMedia={pickMedia}
              onCancelMedia={clearPendingMedia}
              onRetryMedia={retryMedia}
              onDeleteAttachment={(messageId, attachmentId) => void handleDeleteAttachment(messageId, attachmentId)}
              onBack={() => setParams({})}
              onRetryMessages={() => retryMessages(selected.id)}
              onLoadOlder={loadOlderMessages}
              onBlocked={removeSelectedConversation}
              onUnmatched={handleUnmatched}
              replyTo={replyTo}
              onReply={setReplyTo}
              onCancelReply={() => setReplyTo(undefined)}
            />
          ) : selectedId && (loading || loadingMoreConversations || conversationCursor !== null) ? (
            <div className="chat-empty" aria-busy="true">
              <h2>Opening conversation…</h2>
              <p>Finding this chat in your conversations.</p>
            </div>
          ) : selectedId ? (
            <div className="chat-empty">
              <h2>This conversation isn’t available</h2>
              <p>It may have ended, or you no longer have access.</p>
              <button className="shell-primary-action" type="button" onClick={() => setParams({})}>
                Back to chats
              </button>
            </div>
          ) : (
            <ChatEmptyState hasConversations={conversations.length > 0} />
          )}
        </section>
        {selected ? (
          <ChatProfileRail
            profile={loadedProfileId === selected.profile.id ? profile : undefined}
            loading={loadedProfileId !== selected.profile.id && profileErrorId !== selected.profile.id}
            error={profileErrorId === selected.profile.id}
            returnTo={`/chats?conversation=${encodeURIComponent(selected.id)}`}
            onRetry={() => retryProfile(selected.profile.id)}
            onBlocked={removeSelectedConversation}
            matchId={conversationCanCompose(selected) ? selected.match_id : undefined}
            onUnmatched={handleUnmatched}
          />
        ) : null}
      </div>
    </div>
  );
}
