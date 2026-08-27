import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../lib/api/errors.ts";
import { likeProfile } from "../../lib/api/find.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import { listConversations, listIncomingLikes, listMatches, listOutgoingLikes, startConversation } from "../../lib/api/social.ts";
import type { Conversation, LikeListItem, Match } from "../../lib/api/socialTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { mergeById } from "../chats/chatDisplay.ts";
import { DiscoverMatchModule } from "../discovery/DiscoverMatchModule.tsx";
import { buildOptionLabelLookup } from "../find/optionLabels.ts";
import { MatchModal } from "../shell/MatchModal.tsx";
import { HeartIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { LikeInterestSection } from "./LikeInterestSection.tsx";
import { LikesNav } from "./LikesNav.tsx";
import { LikesSkeleton } from "./LikesSkeleton.tsx";
import { LikesSummary } from "./LikesSummary.tsx";
import { LikesTabs } from "./LikesTabs.tsx";
import { LikesTips } from "./LikesTips.tsx";
import { MutualLikesSection } from "./MutualLikesSection.tsx";
import { parseLikesTab, type LikesTab } from "./likesTabs.ts";
import { likeBackErrorCopy, likeBackUnavailable } from "./likeBackError.ts";

export default function LikesPage() {
  const navigate = useNavigate();
  const account = useOwnAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseLikesTab(searchParams.get("tab"));

  const [matches, setMatches] = useState<Match[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<LikeListItem[]>([]);
  const [incomingCursor, setIncomingCursor] = useState<string | null>(null);
  const [incomingError, setIncomingError] = useState(false);
  const [outgoing, setOutgoing] = useState<LikeListItem[]>([]);
  const [outgoingCursor, setOutgoingCursor] = useState<string | null>(null);
  const [outgoingError, setOutgoingError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreIncoming, setLoadingMoreIncoming] = useState(false);
  const [loadingMoreOutgoing, setLoadingMoreOutgoing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsFailed, setConversationsFailed] = useState(false);
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [starting, setStarting] = useState<string>();
  const startingRef = useRef<string>();
  const [likingId, setLikingId] = useState<string>();
  const likingRef = useRef<string>();
  const [matched, setMatched] = useState<LikeListItem & { matchId: string | null }>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.title = "Likes — DateZA";
    let cancelled = false;
    void Promise.allSettled([listMatches(), listIncomingLikes(), listOutgoingLikes()]).then(([matchResult, incomingResult, outgoingResult]) => {
      if (cancelled) return;
      if (matchResult.status === "fulfilled") {
        setMatches(matchResult.value.matches);
        setNextCursor(matchResult.value.next_cursor);
        setError(undefined);
      } else {
        setError(likesErrorMessage(matchResult.reason));
        setMatches([]);
        setNextCursor(null);
      }
      if (incomingResult.status === "fulfilled") {
        setIncoming(incomingResult.value.likes);
        setIncomingCursor(incomingResult.value.next_cursor);
        setIncomingError(false);
      } else {
        setIncoming([]);
        setIncomingCursor(null);
        setIncomingError(true);
      }
      if (outgoingResult.status === "fulfilled") {
        setOutgoing(outgoingResult.value.likes);
        setOutgoingCursor(outgoingResult.value.next_cursor);
        setOutgoingError(false);
      } else {
        setOutgoing([]);
        setOutgoingCursor(null);
        setOutgoingError(true);
      }
      setLoading(false);
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
    setIncomingError(false);
    setOutgoingError(false);
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
    setActionError(undefined);
    const existing = conversations.find((item) => item.match_id === match.id);
    try {
      if (existing) {
        navigate(`/chats?conversation=${existing.id}`);
        return;
      }
      const conversation = await startConversation(match.id);
      navigate(`/chats?conversation=${conversation.id}`);
    } catch {
      setActionError("That didn’t work. Try again.");
    } finally {
      startingRef.current = undefined;
      setStarting(undefined);
    }
  }

  async function likeBack(item: LikeListItem) {
    if (likingRef.current) return;
    likingRef.current = item.profile.id;
    setLikingId(item.profile.id);
    setActionError(undefined);
    try {
      const result = await likeProfile(item.profile.id);
      setIncoming((current) => current.filter((entry) => entry.profile.id !== item.profile.id));
      setOutgoing((current) => current.filter((entry) => entry.profile.id !== item.profile.id));
      if (result.matched) {
        setMatched({ ...item, matchId: result.match_id });
        const listed = await listMatches().catch(() => undefined);
        if (listed) {
          setMatches(listed.matches);
          setNextCursor(listed.next_cursor);
        }
      }
    } catch (caught) {
      if (likeBackUnavailable(caught)) {
        setIncoming((current) => current.filter((entry) => entry.profile.id !== item.profile.id));
        setOutgoing((current) => current.filter((entry) => entry.profile.id !== item.profile.id));
      }
      setActionError(likeBackErrorCopy(caught));
    } finally {
      likingRef.current = undefined;
      setLikingId(undefined);
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
      .catch(() => setActionError("That didn’t work. Try again."))
      .finally(() => setLoadingMore(false));
  }

  function seeMoreIncoming() {
    if (!incomingCursor || loadingMoreIncoming) return;
    setLoadingMoreIncoming(true);
    void listIncomingLikes(incomingCursor)
      .then((result) => {
        setIncoming((current) => mergeLikes(current, result.likes));
        setIncomingCursor(result.next_cursor);
        setIncomingError(false);
      })
      .catch(() => setIncomingError(true))
      .finally(() => setLoadingMoreIncoming(false));
  }

  function seeMoreOutgoing() {
    if (!outgoingCursor || loadingMoreOutgoing) return;
    setLoadingMoreOutgoing(true);
    void listOutgoingLikes(outgoingCursor)
      .then((result) => {
        setOutgoing((current) => mergeLikes(current, result.likes));
        setOutgoingCursor(result.next_cursor);
        setOutgoingError(false);
      })
      .catch(() => setOutgoingError(true))
      .finally(() => setLoadingMoreOutgoing(false));
  }

  const conversationsByMatchId = useMemo(() => {
    const map = new Map<string, Conversation>();
    for (const conversation of conversations) {
      map.set(conversation.match_id, conversation);
    }
    return map;
  }, [conversations]);

  const mutualComplete = !loading && !error && nextCursor === null;
  const incomingComplete = !loading && !incomingError && incomingCursor === null;
  const outgoingComplete = !loading && !outgoingError && outgoingCursor === null;
  const mutualCount = mutualComplete ? matches.length : undefined;
  const incomingCount = incomingComplete ? incoming.length : undefined;
  const outgoingCount = outgoingComplete ? outgoing.length : undefined;
  const featured = useMemo(() => newestMatch(matches), [matches]);
  const optionLabel = buildOptionLabelLookup(configuration);
  const matchedName = matched?.profile.display_name || "them";

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
            <LikesNav
              active={tab}
              incomingCount={incomingCount}
              outgoingCount={outgoingCount}
              mutualCount={mutualCount}
              onChange={setTab}
            />
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
            <LikesTabs
              active={tab}
              incomingCount={incomingCount}
              outgoingCount={outgoingCount}
              mutualCount={mutualCount}
              onChange={setTab}
            />
            {actionError ? (
              <p className="shell-inline-error" role="alert">
                {actionError}
              </p>
            ) : null}
            {conversationsFailed ? (
              <p className="likes-inline-note" role="status">
                Chats didn’t refresh. You can still open matches.
              </p>
            ) : null}

            <div id={`likes-panel-${tab}`} role="tabpanel" aria-labelledby={`likes-tab-${tab}`}>
              {tab === "liked_you" ? (
                <LikeInterestSection
                  kind="incoming"
                  likes={incoming}
                  optionLabel={optionLabel}
                  error={incomingError}
                  nextCursor={incomingCursor}
                  loadingMore={loadingMoreIncoming}
                  likingId={likingId}
                  onRetry={retry}
                  onSeeMore={seeMoreIncoming}
                  onLikeBack={(item) => void likeBack(item)}
                />
              ) : null}
              {tab === "you_liked" ? (
                <LikeInterestSection
                  kind="outgoing"
                  likes={outgoing}
                  optionLabel={optionLabel}
                  error={outgoingError}
                  nextCursor={outgoingCursor}
                  loadingMore={loadingMoreOutgoing}
                  onRetry={retry}
                  onSeeMore={seeMoreOutgoing}
                />
              ) : null}
              {tab === "mutual" ? (
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
              ) : null}
              {tab === "all" ? (
                <div className="likes-all-notes">
                  <LikeInterestSection
                    kind="incoming"
                    likes={incoming}
                    optionLabel={optionLabel}
                    error={incomingError}
                    nextCursor={incomingCursor}
                    loadingMore={loadingMoreIncoming}
                    likingId={likingId}
                    compact
                    onRetry={retry}
                    onSeeMore={seeMoreIncoming}
                    onLikeBack={(item) => void likeBack(item)}
                  />
                  <LikeInterestSection
                    kind="outgoing"
                    likes={outgoing}
                    optionLabel={optionLabel}
                    error={outgoingError}
                    nextCursor={outgoingCursor}
                    loadingMore={loadingMoreOutgoing}
                    compact
                    onRetry={retry}
                    onSeeMore={seeMoreOutgoing}
                  />
                  <MutualLikesSection
                    matches={matches}
                    conversationsByMatchId={conversationsByMatchId}
                    optionLabel={optionLabel}
                    startingId={starting}
                    nextCursor={nextCursor}
                    loadingMore={loadingMore}
                    compact={incoming.length > 0 || outgoing.length > 0}
                    onMessage={(match) => void message(match)}
                    onSeeMore={seeMore}
                  />
                </div>
              ) : null}
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
            {mutualCount != null ? (
              <LikesSummary incomingCount={incomingCount} outgoingCount={outgoingCount} mutualCount={mutualCount} />
            ) : null}
            <LikesTips />
          </aside>
        </div>
      ) : null}

      {matched ? (
        <MatchModal
          name={matchedName}
          photoUrl={matched.profile.photos[0]?.url}
          selfPhotoUrl={account.avatarUrl ?? undefined}
          matchId={matched.matchId}
          continueLabel="Keep looking"
          onContinue={() => setMatched(undefined)}
        />
      ) : null}
    </div>
  );
}

function mergeLikes(current: LikeListItem[], incoming: LikeListItem[]): LikeListItem[] {
  const seen = new Set(current.map((item) => item.profile.id));
  const extra = incoming.filter((item) => !seen.has(item.profile.id));
  return extra.length === 0 ? current : [...current, ...extra];
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
