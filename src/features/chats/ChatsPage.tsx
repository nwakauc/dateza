import { useEffect } from "react";
import { ChatIcon } from "../shell/icons.tsx";

/**
 * DateZA has no messaging backend yet (no conversations/messages endpoints
 * exist in lib/api). This holds the route, the nav destination, and the
 * list+detail layout shape so wiring in real conversations later is a data
 * change, not a redesign — it never fabricates conversations.
 */
export default function ChatsPage() {
  useEffect(() => {
    document.title = "Chats — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  return (
    <div className="shell-page" id="main-content">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Conversations</p>
        <h1 className="shell-page__title">Chats</h1>
        <p className="shell-page__subtitle">Message the people you've matched with.</p>
      </div>

      <div className="chats-layout">
        <div className="chats-list">
          <div className="shell-empty shell-empty--in-list">
            <ChatIcon className="shell-empty__icon" />
            <p className="shell-empty__title">No conversations yet</p>
            <p className="shell-empty__body">
              When you match with someone, you can start chatting here. Head to Discover or Find to make your
              first match.
            </p>
          </div>
        </div>
        <div className="chats-detail">
          <p className="shell-page__subtitle">Select a conversation to start chatting.</p>
        </div>
      </div>
    </div>
  );
}
