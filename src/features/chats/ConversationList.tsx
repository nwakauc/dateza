import { Link } from "react-router-dom";
import type { ReceivedOpener } from "../../lib/api/openerTypes.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { IncomingOpener } from "../opener/IncomingOpener.tsx";
import { ChatIcon } from "../shell/icons.tsx";
import { conversationTime } from "./chatDisplay.ts";

type Props = {
  conversations: Conversation[];
  openers: ReceivedOpener[];
  selectedId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  openersError: boolean;
  loadingMoreOpeners: boolean;
  openersHasMore: boolean;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
  onLoadMoreOpeners: () => void;
  onRetryOpeners: () => void;
  onOpenersChanged: () => void;
  onOpenerReplied: (openerId: string, conversation: Conversation) => void;
};

function ConversationAvatar({ conversation, name }: { conversation: Conversation; name: string }) {
  const photo = conversation.profile.photos[0];
  return photo ? (
    <img src={photo.url} width="56" height="56" alt="" />
  ) : (
    <span className="conversation-row__initial" aria-hidden="true">
      {name[0]?.toUpperCase()}
    </span>
  );
}

export function ConversationList({
  conversations,
  openers,
  selectedId,
  loading,
  loadingMore,
  hasMore,
  openersError,
  loadingMoreOpeners,
  openersHasMore,
  onSelect,
  onLoadMore,
  onLoadMoreOpeners,
  onRetryOpeners,
  onOpenersChanged,
  onOpenerReplied,
}: Props) {
  const empty = !loading && conversations.length === 0 && openers.length === 0 && !openersError;

  return (
    <aside className="chats-list" aria-label="Conversations">
      <header className="chats-list__header">
        <div>
          <p>Relationships</p>
          <h1>Chats</h1>
        </div>
        <span>{conversations.length > 0 ? `${conversations.length} loaded` : "Your connections"}</span>
      </header>

      {loading ? <ConversationListSkeleton /> : null}

      {empty ? (
        <div className="chats-list__empty">
          <span className="chats-list__empty-icon"><ChatIcon /></span>
          <h2>No conversations yet</h2>
          <p>When a match becomes a conversation, it will be waiting here.</p>
          <div>
            <Link to="/discover">Discover people</Link>
            <Link to="/likes">Go to Likes</Link>
          </div>
        </div>
      ) : null}

      {!loading && openersError ? (
        <div className="chats-list__note" role="alert">
          <p>Openers didn’t load. Your chats are still here.</p>
          <button type="button" onClick={onRetryOpeners}>
            Try openers again
          </button>
        </div>
      ) : null}

      {!loading && openers.length > 0 ? (
        <section className="chats-openers" aria-labelledby="incoming-openers-title">
          <div className="chats-openers__heading">
            <h2 id="incoming-openers-title">New openers</h2>
            <span>{openers.length}</span>
          </div>
          {openers.map((opener) => (
            <IncomingOpener
              key={opener.id}
              opener={opener}
              onResolved={onOpenersChanged}
              onReplied={onOpenerReplied}
            />
          ))}
          {openersHasMore ? (
            <button className="chats-list__more" type="button" onClick={onLoadMoreOpeners} disabled={loadingMoreOpeners}>
              {loadingMoreOpeners ? "Loading…" : "Load more openers"}
            </button>
          ) : null}
        </section>
      ) : null}

      {!loading && conversations.length > 0 ? (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const name = conversation.profile.display_name || "DateZA member";
            const preview = conversation.last_message;
            return (
              <button
                type="button"
                key={conversation.id}
                className={`conversation-row${selectedId === conversation.id ? " conversation-row--active" : ""}`}
                aria-current={selectedId === conversation.id ? "true" : undefined}
                onClick={() => onSelect(conversation.id)}
              >
                <ConversationAvatar conversation={conversation} name={name} />
                <span className="conversation-row__copy">
                  <span className="conversation-row__top">
                    <strong>{name}</strong>
                    {preview ? <time dateTime={preview.created_at}>{conversationTime(preview.created_at)}</time> : null}
                  </span>
                  <span>
                    {preview?.body || "Start the conversation"}
                    {conversation.status === "closed" ? <em className="conversation-row__closed">Closed</em> : null}
                  </span>
                </span>
              </button>
            );
          })}
          {hasMore ? (
            <button className="chats-list__more" type="button" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more conversations"}
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="conversation-list conversation-list--loading" aria-label="Loading chats" aria-busy="true">
      {[0, 1, 2, 3, 4].map((item) => (
        <div className="conversation-row conversation-row--skeleton" key={item}>
          <span />
          <span><i /><i /></span>
        </div>
      ))}
    </div>
  );
}
