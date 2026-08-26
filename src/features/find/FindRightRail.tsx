import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { ProfileStandOutPrompt } from "../profile/ProfileStandOutPrompt.tsx";
import { FindConversationPreview } from "./FindConversationPreview.tsx";
import { FindMatchPanel } from "./FindMatchPanel.tsx";
import { FindOpenerPanel, type OpenerView } from "./FindOpenerPanel.tsx";
import { FindRecentActivity } from "./FindRecentActivity.tsx";

type Props = {
  name: string;
  profileId: string;
  matched: boolean;
  photoUrl?: string;
  selfPhotoUrl?: string;
  openerView: OpenerView;
  conversation?: Conversation;
  online?: boolean;
  notifications: ProductNotification[];
  activityLoading: boolean;
  activityUnavailable: boolean;
  onKeepFinding: () => void;
  onOpenerSent: () => void;
  onSendOpener: () => void;
};

export function FindRightRail({
  name,
  profileId,
  matched,
  photoUrl,
  selfPhotoUrl,
  openerView,
  conversation,
  online,
  notifications,
  activityLoading,
  activityUnavailable,
  onKeepFinding,
  onOpenerSent,
  onSendOpener,
}: Props) {
  let primary = (
    <FindOpenerPanel profileId={profileId} name={name} view={openerView} onSent={onOpenerSent} />
  );
  if (matched) {
    primary = (
      <FindMatchPanel
        name={name}
        photoUrl={photoUrl}
        selfPhotoUrl={selfPhotoUrl}
        onKeepFinding={onKeepFinding}
        onSendOpener={onSendOpener}
      />
    );
  } else if (conversation) {
    primary = <FindConversationPreview conversation={conversation} online={online} />;
  } else if (openerView === "waiting") {
    primary = <FindOpenerPanel profileId={profileId} name={name} view="waiting" onSent={onOpenerSent} />;
  }

  return (
    <aside className="find-rail" aria-label="Find updates">
      {primary}
      <ProfileStandOutPrompt />
      <FindRecentActivity notifications={notifications} loading={activityLoading} unavailable={activityUnavailable} />
    </aside>
  );
}
