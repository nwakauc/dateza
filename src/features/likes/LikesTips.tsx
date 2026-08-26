import { Link } from "react-router-dom";
import { hrefForCompletionKey } from "../profile/completionLinks.ts";
import { datezaRichness } from "../profile/richProfileGaps.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { describeMissing } from "../discovery/completionCopy.ts";

type Item = { key: string; label: string; href: string };

export function LikesTips() {
  const account = useOwnAccount();
  if (account.loading) return null;

  const richness = datezaRichness(account.profile, account.photoCount);
  const d8n = account.profile?.profile_completion;
  const d8nReportsGaps =
    d8n != null &&
    (Math.round(d8n.percent) < 100 || d8n.suggestions.length > 0 || d8n.missing.length > 0);

  let items: Item[] = [];
  if (d8n != null && d8nReportsGaps) {
    items =
      d8n.suggestions.length > 0
        ? d8n.suggestions.slice(0, 4).map((item) => ({
            key: item.key,
            label: item.label,
            href: hrefForCompletionKey(item.key),
          }))
        : describeMissing(d8n.missing).map((item) => ({
            key: item.key,
            label: item.label,
            href: hrefForCompletionKey(item.key),
          }));
  } else if (richness.filled < richness.total) {
    items = richness.items.slice(0, 4).map((item) => ({
      key: item.key,
      label: item.label,
      href: hrefForCompletionKey(item.key),
    }));
  }

  if (items.length === 0) return null;

  return (
    <section className="likes-rail-card" aria-label="Make your profile stand out">
      <h2 className="likes-rail-card__title">Make your profile stand out ✨</h2>
      <p className="likes-rail-card__body">A fuller profile helps the right people find you.</p>
      <ul className="likes-tips">
        {items.map((item) => (
          <li key={item.key}>
            <Link to={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
