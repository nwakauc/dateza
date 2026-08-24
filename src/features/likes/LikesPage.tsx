import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMatches, startConversation } from "../../lib/api/social.ts";
import type { Match } from "../../lib/api/socialTypes.ts";
import { ChatIcon, HeartIcon } from "../shell/icons.tsx";

export default function LikesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [starting, setStarting] = useState<string>(); const [actionError, setActionError] = useState(false);
  const load = useCallback(() => { void listMatches().then((result) => setMatches(result.matches)).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  function retry() { setLoading(true); setError(false); load(); }
  useEffect(() => { document.title = "Likes — DateZA"; load(); return () => { document.title = "DateZA — Meet someone who chooses you."; }; }, [load]);
  async function message(match: Match) { setStarting(match.id); setActionError(false); try { const conversation = await startConversation(match.id); navigate(`/chats?conversation=${conversation.id}`); } catch { setActionError(true); } finally { setStarting(undefined); } }
  return <div className="shell-page">
    <div className="shell-page__header"><p className="shell-page__eyebrow">Mutual interest</p><h1 className="shell-page__title">Likes</h1><p className="shell-page__subtitle">When you both choose each other, your matches appear here.</p></div>
    <div className="likes-note"><HeartIcon filled={false} /><p><strong>Likes you</strong> is not available yet. Your mutual matches are live below.</p></div>
    {loading ? <div className="shell-loading" aria-live="polite"><span />Loading your matches…</div> : null}
    {error ? <div className="shell-empty"><HeartIcon className="shell-empty__icon" filled={false} /><p className="shell-empty__title">Your matches didn’t load</p><p className="shell-empty__body">Check your connection, then try again.</p><button className="shell-primary-action" type="button" onClick={retry}>Try again</button></div> : null}
    {!loading && !error && matches.length === 0 ? <div className="shell-empty"><HeartIcon className="shell-empty__icon" filled={false} /><p className="shell-empty__title">No matches yet</p><p className="shell-empty__body">A match happens when you and someone else both like each other.</p><Link className="shell-primary-action" to="/find">Explore Find</Link></div> : null}
    {actionError ? <p className="shell-inline-error" role="alert">That chat couldn’t open. Try again.</p> : null}
    {!loading && !error && matches.length > 0 ? <div className="match-grid">{matches.map((match) => { const photo = match.profile.photos[0]; const name = match.profile.display_name || "DateZA member"; return <article className="match-card" key={match.id}><Link to={`/profile/${match.profile.id}`} className="match-card__photo">{photo ? <img src={photo.url} width="480" height="600" loading="lazy" alt={`${name}'s profile`} /> : <span>{name[0]?.toUpperCase()}</span>}</Link><div className="match-card__body"><div><h2>{name}{match.profile.age ? `, ${match.profile.age}` : ""}</h2><p>You matched</p></div><button type="button" aria-label={`Message ${name}`} onClick={() => void message(match)} disabled={starting === match.id}><ChatIcon />{starting === match.id ? "Opening…" : "Message"}</button></div></article>; })}</div> : null}
  </div>;
}
