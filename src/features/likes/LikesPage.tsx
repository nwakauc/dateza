import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../lib/api/errors.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import { listConversations, listMatches, startConversation } from "../../lib/api/social.ts";
import type { Conversation, Match } from "../../lib/api/socialTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { mergeById } from "../chats/chatDisplay.ts";
import { DiscoverMatchModule } from "../discovery/DiscoverMatchModule.tsx";
import { buildOptionLabelLookup } from "../find/optionLabels.ts";
import { HeartIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { LikesInterestBoundary } from "./LikesInterestBoundary.tsx";
import { LikesNav } from "./LikesNav.tsx";
import { LikesSkeleton } from "./LikesSkeleton.tsx";
import { LikesSummary } from "./LikesSummary.tsx";
import { LikesTabs } from "./LikesTabs.tsx";
import { LikesTips } from "./LikesTips.tsx";
import { MutualLikesSection } from "./MutualLikesSection.tsx";
import { parseLikesTab, type LikesTab } from "./likesTabs.ts";

export default function LikesPage() {
  const navigate = useNavigate();
  const account = useOwnAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseLikesTab(searchParams.get("tab"));

  const [matches, setMatches] = useState<Match[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsFailed, setConversationsFailed] = useState(false);
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [starting, setStarting] = useState<string>();
  const startingRef = useRef<string>();
  const [actionError, setActionError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.title = "Likes — DateZA";
    let cancelled = false;
    void listMatches()
      .then((result) => {
        if (cancelled) return;
        setMatches(result.matches);
        setNextCursor(result.next_cursor);
        setError(undefined);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(likesErrorMessage(caught));
        setMatches([]);
        setNextCursor(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    void listConversations()
      .then((result) => {
        if (cancelled) return;
        setConversations(result.conversations);
        setConversationsFailed(false);
      })
      .catch(() => {
        if (!cancelled) setConversationsFailed(true);
      });
    void getProfileConfiguration()
      .then((result) => {
        if (!cancelled) setConfiguration(result.configuration);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [attempt]);

  function retry() {
    setLoading(true);
    setError(undefined);
    setConversationsFailed(false);
    setAttempt((current) => current + 1);
  }

  function setTab(next: LikesTab) {
    setSearchParams(next === "all" ? {} : { tab: next }, { replace: true });
  }

  async function message(match: Match) {
    if (startingRef.current) return;
    startingRef.current = match.id;
    setStarting(match.id);
    setActionError(false);
    const existing = conversations.find((item) => item.match_id === match.id);
    try {
      if (existing) {
        navigate(`/chats?conversation=${existing.id}`);
        return;
      }
      const conversation = await startConversation(match.id);
      navigate(`/chats?conversation=${conversation.id}`);
    } catch {
      setActionError(true);
    } finally {
      startingRef.current = undefined;
      setStarting(undefined);
    }
  }

  function seeMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    void listMatches(nextCursor)
      .then((result) => {
        setMatches((current) => mergeById(current, result.matches));
        setNextCursor(result.next_cursor);
      })
      .catch(() => setActionError(true))
      .finally(() => setLoadingMore(false));
  }

  const conversationsByMatchId = useMemo(() => {
    const map = new Map<string, Conversation>();
    for (const conversation of conversations) {
      map.set(conversation.match_id, conversation);
    }
    return map;
  }, [conversations]);

  const mutualComplete = !loading && !error && nextCursor === null;
  const mutualCount = mutualComplete ? matches.length : undefined;
  const featured = useMemo(() => newestMatch(matches), [matches]);
  const optionLabel = buildOptionLabelLookup(configuration);

  return (
    <div className="shell-page likes-page">
      {loading ? <LikesSkeleton /> : null}

      {!loading && error ? (
        <div className="shell-empty">
          <HeartIcon className="shell-empty__icon" filled={false} />
          <p className="shell-empty__title">We couldn’t load your likes</p>
          <p className="shell-empty__body">{error}</p>
          <button className="shell-primary-action" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="likes-stage">
          <aside className="likes-rail likes-rail--left">
            <section className="likes-rail-card likes-popularity" aria-label="Your matches">
              <p className="likes-popularity__label">Your matches</p>
              {mutualCount != null ? (
                <p className="likes-popularity__value">{mutualCount}</p>
              ) : (
                <p className="likes-popularity__value likes-popularity__value--live">{matches.length}+</p>
              )}
              <p className="likes-popularity__hint">
                {matches.length > 0 ? "People who like you back." : "Like someone who likes you — that’s a match."}
              </p>
            </section>
            <LikesNav active={tab} mutualCount={mutualCount} onChange={setTab} />
          </aside>

          <div className="likes-main">
            <header className="likes-header">
              <h1 className="likes-header__title">
                Likes <HeartIcon className="likes-header__heart" filled />
              </h1>
              <p className="likes-header__subtitle">
                {tab === "liked_you"
                  ? "People who are interested in you."
                  : tab === "you_liked"
                    ? "People you’ve already chosen."
                    : tab === "mutual"
                      ? "People who like you back live here."
                      : "People who are interested in you."}
              </p>
            </header>
            <LikesTabs active={tab} mutualCount={mutualCount} onChange={setTab} />
            {actionError ? (
              <p className="shell-inline-error" role="alert">
                That didn’t work. Try again.
              </p>
            ) : null}
            {conversationsFailed ? (
              <p className="likes-inline-note" role="status">
                Chats didn’t refresh. You can still open matches.
              </p>
            ) : null}

            <div id={`likes-panel-${tab}`} role="tabpanel" aria-labelledby={`likes-tab-${tab}`}>
              {tab === "liked_you" || tab === "you_liked" ? (
                <LikesInterestBoundary tab={tab} onShowMutual={() => setTab("mutual")} />
              ) : (
                <>
                  <MutualLikesSection
                    matches={matches}
                    conversationsByMatchId={conversationsByMatchId}
                    optionLabel={optionLabel}
                    startingId={starting}
                    nextCursor={nextCursor}
                    loadingMore={loadingMore}
                    onMessage={(match) => void message(match)}
                    onSeeMore={seeMore}
                  />
                  {tab === "all" ? (
                    <div className="likes-all-notes">
                      <LikesInterestBoundary tab="liked_you" compact onShowMutual={() => setTab("mutual")} />
                      <LikesInterestBoundary tab="you_liked" compact onShowMutual={() => setTab("mutual")} />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <aside className="likes-rail likes-rail--right">
            {featured ? (
              <DiscoverMatchModule
                name={featured.profile.display_name ?? "them"}
                photoUrl={featured.profile.photos[0]?.url}
                selfPhotoUrl={account.avatarUrl ?? undefined}
                matchId={featured.id}
                onKeepDiscovering={() => navigate("/discover")}
              />
            ) : null}
            {mutualCount != null ? <LikesSummary mutualCount={mutualCount} /> : null}
            <LikesTips />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function newestMatch(matches: Match[]): Match | undefined {
  if (matches.length === 0) return undefined;
  let newest = matches[0]!;
  for (const match of matches) {
    if (Date.parse(match.matched_at) > Date.parse(newest.matched_at)) newest = match;
  }
  return newest;
}

function likesErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "Verify your contact details to see your matches.";
  }
  return "Check your connection, then try again.";
}
