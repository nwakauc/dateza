import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { ProfileCompletionPanel } from "../discovery/ProfileCompletionPanel.tsx";
import { datezaRichness } from "./richProfileGaps.ts";

type Props = {
  compact?: boolean;
};

/**
 * Prompts members to finish the public DateZA profile, not merely onboarding.
 * D8N `profile_completion` is used when it reports unfinished richness.
 * Publication/onboarding 100% is ignored when bio, prompts, photos, and
 * other public details are still empty on GET /profile.
 */
export function ProfileStandOutPrompt({ compact = false }: Props) {
  const account = useOwnAccount();
  if (account.loading) return null;

  const richness = datezaRichness(account.profile, account.photoCount);
  const d8n = account.profile?.profile_completion;
  const d8nReportsGaps =
    d8n != null &&
    (Math.round(d8n.percent) < 100 || d8n.suggestions.length > 0 || d8n.missing.length > 0);

  if (d8n != null && d8nReportsGaps) {
    return (
      <ProfileCompletionPanel compact={compact} profileCompletion={d8n} datezaRichness={richness} />
    );
  }

  if (richness.filled < richness.total) {
    return <ProfileCompletionPanel compact={compact} datezaRichness={richness} />;
  }

  return null;
}
