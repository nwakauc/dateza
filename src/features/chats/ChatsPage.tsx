import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProfileDetail } from "../../lib/api/find.ts";
import { listReceivedOpeners } from "../../lib/api/opener.ts";
import type { ReceivedOpener } from "../../lib/api/openerTypes.ts";
import { listConversations, listMatches, listMessages, sendMessage } from "../../lib/api/social.ts";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { Conversation, Match, Message } from "../../lib/api/socialTypes.ts";
import { ChatIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { ChatProfileRail } from "./ChatProfileRail.tsx";
import { mergeById, replaceConversationPreview, upsertConversation } from "./chatDisplay.ts";
import { ConversationList } from "./ConversationList.tsx";
import { ChatEmptyState, ConversationView } from "./ConversationView.tsx";

export default function ChatsPage() {
  const account = useOwnAccount();
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
  const [profile, setProfile] = useState<ProfileDetail>();
  const [loadedProfileId, setLoadedProfileId] = useState<string>();
  const [profileErrorId, setProfileErrorId] = useState<string>();
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

  const loadMessages = useCallback((conversationId: string) => {
    return listMessages(conversationId)
      .then((result) => {
        setMessages(result.messages);
        setMessageCursor(result.next_cursor);
        setLoadedConversationId(conversationId);
      })
      .catch(() => {
        setMessages([]);
        setMessageCursor(null);
        setMessageErrorId(conversationId);
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
    void Promise.all([loadMessages(selectedId), loadProfile(selectedProfileId)]);
  }, [selectedId, selectedProfileId, loadMessages, loadProfile]);

  function retry() {
    setLoading(true);
    setError(false);
    load(selectedId);
  }

  function selectConversation(id: string) {
    setDraft("");
    setSendError(false);
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
    if (!selected || !body || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(false);
    try {
      const message = await sendMessage(selected.id, body);
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [message, ...current]));
      setConversations((current) => replaceConversationPreview(current, selected.id, message));
      setDraft("");
    } catch {
      setSendError(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function removeSelectedConversation() {
    if (!selected) return;
    setConversations((current) => current.filter((conversation) => conversation.id !== selected.id));
    setParams({});
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
              onDraft={setDraft}
              onSend={(event) => void submit(event)}
              onBack={() => setParams({})}
              onRetryMessages={() => retryMessages(selected.id)}
              onLoadOlder={loadOlderMessages}
              onBlocked={removeSelectedConversation}
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
          />
        ) : null}
      </div>
    </div>
  );
}
