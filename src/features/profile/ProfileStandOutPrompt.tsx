import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { ProfileCompletionPanel } from "../discovery/ProfileCompletionPanel.tsx";
import { datezaRichness } from "./richProfileGaps.ts";

type Props = {
  compact?: boolean;
};

/**
 * Prompts members to finish the public DateZA profile, not merely onboarding.
 * Publication/onboarding 100% is ignored when public details are still empty.
 */
export function ProfileStandOutPrompt({ compact = false }: Props) {
  const account = useOwnAccount();
  if (account.loading) return null;

  const richness = datezaRichness(account.profile, account.photoCount);
  return (
    <ProfileCompletionPanel
      compact={compact}
      profileCompletion={account.profile?.profile_completion ?? undefined}
      datezaRichness={richness}
    />
  );
}
