import { Link } from "react-router-dom";
import { hrefForCompletionKey } from "../profile/completionLinks.ts";
import { datezaRichness } from "../profile/richProfileGaps.ts";
import { standOutProgress } from "../profile/standOutProgress.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

export function LikesTips() {
  const account = useOwnAccount();
  if (account.loading) return null;

  const richness = datezaRichness(account.profile, account.photoCount);
  const progress = standOutProgress(richness, account.profile?.profile_completion);
  if (progress.complete || progress.items.length === 0) return null;

  return (
    <section className="likes-rail-card" aria-label="Make your profile stand out">
      <h2 className="likes-rail-card__title">Make your profile stand out</h2>
      <p className="likes-rail-card__body">A fuller profile helps the right people find you.</p>
      <ul className="likes-tips">
        {progress.items.map((item) => (
          <li key={item.key}>
            <Link to={hrefForCompletionKey(item.key)}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
