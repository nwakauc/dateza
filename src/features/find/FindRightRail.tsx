import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import type { ConfiguredOpener, OpenerState } from "../../lib/api/openerTypes.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { OpenerSurface } from "../opener/OpenerSurface.tsx";
import { ProfileStandOutPrompt } from "../profile/ProfileStandOutPrompt.tsx";
import { FindMatchPanel } from "./FindMatchPanel.tsx";
import { FindRecentActivity } from "./FindRecentActivity.tsx";

type Props = {
  name: string;
  profileId: string;
  matched: boolean;
  matchId: string | null;
  photoUrl?: string;
  selfPhotoUrl?: string;
  openerState: OpenerState | undefined;
  catalogue: ConfiguredOpener[];
  catalogueLoading?: boolean;
  catalogueFailed?: boolean;
  sentText?: string;
  expiresAt?: string;
  conversation?: Conversation;
  online?: boolean;
  notifications: ProductNotification[];
  activityLoading: boolean;
  activityUnavailable: boolean;
  onKeepFinding: () => void;
  onOpenerSent: (text: string, expiresAt: string) => void;
  onRetryCatalogue?: () => void;
};

export function FindRightRail({
  name,
  profileId,
  matched,
  matchId,
  photoUrl,
  selfPhotoUrl,
  openerState,
  catalogue,
  catalogueLoading,
  catalogueFailed,
  sentText,
  expiresAt,
  conversation,
  online,
  notifications,
  activityLoading,
  activityUnavailable,
  onKeepFinding,
  onOpenerSent,
  onRetryCatalogue,
}: Props) {
  const primary = matched ? (
    <FindMatchPanel
      name={name}
      photoUrl={photoUrl}
      selfPhotoUrl={selfPhotoUrl}
      matchId={matchId}
      onKeepFinding={onKeepFinding}
    />
  ) : (
    <OpenerSurface
      profileId={profileId}
      name={name}
      online={online}
      catalogue={catalogue}
      catalogueLoading={catalogueLoading}
      catalogueFailed={catalogueFailed}
      openerState={openerState}
      sentText={sentText}
      expiresAt={expiresAt}
      conversation={conversation}
      onSent={onOpenerSent}
      onRetryCatalogue={onRetryCatalogue}
    />
  );

  return (
    <aside className="find-rail" aria-label="Find updates">
      {primary}
      <ProfileStandOutPrompt />
      <FindRecentActivity notifications={notifications} loading={activityLoading} unavailable={activityUnavailable} />
    </aside>
  );
}
