import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { listBlockedProfiles, unblockProfile } from "../../lib/api/safety.ts";
import type { BlockedProfile } from "../../lib/api/safetyTypes.ts";
import { publishCurrentProfile, unpublishCurrentProfile } from "../../lib/api/profile.ts";
import { canInteract } from "../session/verificationState.ts";
import { useSession } from "../session/useSession.ts";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  LightbulbIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

type ActionRowProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  to?: string;
  status?: string;
  expanded?: boolean;
};

function SafetyActionRow({ icon, title, description, onClick, to, status, expanded }: ActionRowProps) {
  const content = (
    <>
      <span className="safety-action__icon">{icon}</span>
      <span className="safety-action__copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      {status ? <span className="safety-action__status">{status}</span> : null}
      {to || onClick ? <ChevronRightIcon className="safety-action__chevron" /> : null}
    </>
  );
  if (to) return <Link className="safety-action" to={to}>{content}</Link>;
  if (onClick) {
    return (
      <button className="safety-action" type="button" onClick={onClick} aria-expanded={expanded}>
        {content}
      </button>
    );
  }
  return <div className="safety-action safety-action--static">{content}</div>;
}

const GUIDE_SECTIONS = [
  ["Before meeting", "Chat first, choose a public place, arrange your own transport and tell someone you trust where you are going."],
  ["During the date", "Keep your phone with you, watch your own drinks and leave whenever you feel uncomfortable."],
  ["Online conversations", "Take your time. Be cautious if someone pressures you to leave DateZA quickly or avoids reasonable questions."],
  ["Personal information", "Avoid sharing your home address, workplace routine, passwords, OTPs or identification documents."],
  ["Money and scams", "Never send money. Be wary of investment, cryptocurrency, emergency or financial-help requests."],
  ["Sexual boundaries and consent", "Consent must be freely given, specific and ongoing. You can change your mind at any time."],
  ["After the date", "Check in with someone you trust. If you feel unsafe, stop contact and use the block or report controls."],
  ["Reporting concerns", "Open the member’s profile and choose Report. From a chat, open their profile first. Reports stay private."],
] as const;

export default function SafetyPage() {
  const account = useOwnAccount();
  const { verification } = useSession();
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>();
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockedError, setBlockedError] = useState<string>();
  const [unblockingId, setUnblockingId] = useState<string>();
  const [visibilityPhase, setVisibilityPhase] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    document.title = "Safety centre — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listBlockedProfiles()
      .then((blocks) => {
        if (!cancelled) setBlockedProfiles(blocks);
      })
      .catch(() => {
        if (!cancelled) setBlockedError("We couldn't load your blocked members.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const verified = canInteract(verification) || account.profile?.contact_verified === true;
  const profileVisible =
    account.onboarding?.profile_published === true && account.profile?.visibility === "visible";

  async function unblock(profileId: string) {
    if (unblockingId) return;
    setUnblockingId(profileId);
    setBlockedError(undefined);
    try {
      await unblockProfile(profileId);
      setBlockedProfiles((current) => current?.filter((item) => item.profile.id !== profileId));
    } catch {
      setBlockedError("We couldn't unblock this member. Nothing changed. Try again.");
    } finally {
      setUnblockingId(undefined);
    }
  }

  async function toggleVisibility() {
    if (visibilityPhase === "saving") return;
    setVisibilityPhase("saving");
    try {
      if (profileVisible) await unpublishCurrentProfile();
      else await publishCurrentProfile();
      account.refresh();
      setVisibilityPhase("idle");
    } catch {
      setVisibilityPhase("error");
    }
  }

  return (
    <div className="shell-page safety-page">
      <header className="safety-mobile-header">
        <Link to="/settings" aria-label="Back to settings"><ChevronLeftIcon /></Link>
        <strong>Safety</strong>
        <ShieldIcon />
      </header>

      <div className="safety-layout">
        <aside className="safety-settings-nav" aria-label="Settings">
          <h2>Settings</h2>
          <Link to="/settings#account"><UserIcon /> Account</Link>
          <Link className="safety-settings-nav__active" to="/settings/safety"><ShieldIcon /> Privacy &amp; safety</Link>
          <Link to="/settings#notifications">Notifications</Link>
          <Link to="/settings#preferences">Preferences</Link>
          <a href="#blocked"><UsersIcon /> Blocked users</a>
          <Link to="/settings#verification"><ShieldCheckIcon /> Verification</Link>
          <Link to="/settings#payments">Payment &amp; plans</Link>
          <Link to="/settings#data"><EyeIcon /> Data &amp; permissions</Link>
          <Link to="/settings#help">Help &amp; support</Link>
          <Link to="/settings#about">About DateZA</Link>
          <div className="safety-settings-card">
            <span><ShieldCheckIcon /></span>
            <strong>Your safety matters</strong>
            <p>Practical guidance for a positive and respectful experience.</p>
            <a href="#tips">Safety tips</a>
          </div>
        </aside>

        <main className="safety-main">
          <div className="safety-heading">
            <h1>Safety centre</h1>
            <p>Tools and resources to help keep you safe and in control.</p>
          </div>

          <section className="safety-hero" aria-labelledby="safety-hero-title">
            <span className="safety-hero__shield"><ShieldCheckIcon /></span>
            <div>
              <h2 id="safety-hero-title">You&apos;re in control</h2>
              <p>We&apos;re here to help you have a safe and positive experience.</p>
              <a href="#guide">Learn more</a>
            </div>
            <div className="safety-hero__art" aria-hidden="true">
              <span className="safety-hero__art-shield"><ShieldCheckIcon /></span>
              <i>♥</i><i>♥</i><i>♥</i>
            </div>
          </section>

          <section className="safety-section" aria-labelledby="safety-tools-title">
            <div className="safety-section__heading">
              <h2 id="safety-tools-title">Safety tools</h2>
              <p>Quick actions to protect yourself and manage your experience.</p>
            </div>
            <div className="safety-action-list">
              <SafetyActionRow
                icon={<UsersIcon />}
                title="Blocked users"
                description="View and manage people you've blocked."
                onClick={() => {
                  setReportOpen(false);
                  setBlockedOpen((value) => !value);
                }}
                expanded={blockedOpen}
              />
              <SafetyActionRow
                icon={<ShieldIcon />}
                title="Report a member"
                description="Open their profile, then choose Report."
                onClick={() => {
                  setBlockedOpen(false);
                  setReportOpen((value) => !value);
                }}
                expanded={reportOpen}
              />
              <SafetyActionRow icon={<ShieldIcon />} title="Mute conversations" description="Conversation muting isn't available yet." status="Unavailable" />
              <SafetyActionRow
                icon={<EyeIcon />}
                title={profileVisible ? "Pause dating" : "Resume dating"}
                description={profileVisible ? "Stop appearing to new people until you return." : "Make your published profile visible again."}
                onClick={() => void toggleVisibility()}
                status={visibilityPhase === "saving" ? "Saving…" : profileVisible ? "Visible" : "Hidden"}
              />
            </div>
            {visibilityPhase === "error" ? <p className="safety-inline-error" role="alert">We couldn&apos;t update your profile visibility. Nothing changed. Try again.</p> : null}
          </section>

          <section className="safety-report" id="report" hidden={!reportOpen} aria-labelledby="report-title">
            <div className="safety-section__heading">
              <h2 id="report-title">How to report someone</h2>
              <p>Reporting happens from that person&apos;s profile — not from this page.</p>
            </div>
            <p>Open their profile and choose <strong>Report</strong>. DateZA reviews reports privately. We don&apos;t tell the other person who reported them.</p>
            <p>If you already have a match or chat, open that conversation, go to their profile, then choose Report.</p>
            <p>DateZA can&apos;t look someone up from the Safety centre. Start from people you&apos;ve already seen.</p>
            <div className="safety-report__actions">
              <Link className="shell-primary-action" to="/discover">Go to Discover</Link>
              <Link className="shell-text-action" to="/find">Go to Find</Link>
            </div>
          </section>

          <section className="safety-blocked" id="blocked" hidden={!blockedOpen} aria-labelledby="blocked-title">
            <div className="safety-section__heading">
              <h2 id="blocked-title">Blocked users</h2>
              <p>Only the minimum details needed to manage your list are shown.</p>
            </div>
            {blockedProfiles === undefined && !blockedError ? <div className="safety-loading" aria-label="Loading blocked members"><span /><span /></div> : null}
            {blockedError ? <p className="safety-inline-error" role="alert">{blockedError}</p> : null}
            {blockedProfiles?.length === 0 ? <div className="safety-empty"><strong>No blocked members</strong><p>People you block will appear here.</p></div> : null}
            {blockedProfiles?.map((block) => (
              <div className="safety-blocked-row" key={block.profile.id}>
                <span className="safety-blocked-row__avatar" aria-hidden="true">{block.profile.display_name.trim()[0]?.toUpperCase() ?? "D"}</span>
                <span><strong>{block.profile.display_name}</strong><small>Blocked</small></span>
                <button type="button" disabled={unblockingId === block.profile.id} onClick={() => void unblock(block.profile.id)}>
                  {unblockingId === block.profile.id ? "Unblocking…" : "Unblock"}
                </button>
              </div>
            ))}
          </section>

          <section className="safety-section" aria-labelledby="resources-title">
            <div className="safety-section__heading">
              <h2 id="resources-title">Safety resources</h2>
              <p>Practical guidance for safer interactions online and offline.</p>
            </div>
            <div className="safety-resources">
              <a href="#tips"><LightbulbIcon /><strong>Safety tips</strong><span>Practical tips for safer interactions.</span><b>View tips →</b></a>
              <a href="#guide"><ShieldCheckIcon /><strong>Dating safety guide</strong><span>Guidance for every stage of meeting.</span><b>Read guide →</b></a>
              <div aria-disabled="true"><ShieldIcon /><strong>Help &amp; support</strong><span>A verified support channel is not available yet.</span><b>Unavailable</b></div>
            </div>
          </section>

          <section className="safety-tips" id="tips" aria-labelledby="tips-title">
            <h2 id="tips-title">Stay alert without losing the spark</h2>
            <div className="safety-tip-grid">
              <article><strong>Keep money out of it</strong><p>Never send money to someone you met through DateZA—even for an emergency, investment or travel.</p></article>
              <article><strong>Keep private details private</strong><p>Never share passwords, OTPs, banking information or identification documents.</p></article>
              <article><strong>Meet on your terms</strong><p>Choose a public place, arrange your own transport and tell someone you trust where you&apos;re going.</p></article>
              <article><strong>Take your time</strong><p>Be cautious if someone quickly pressures you to move away from DateZA or into financial conversations.</p></article>
            </div>
          </section>

          <section className="safety-guide" id="guide" aria-labelledby="guide-title">
            <div className="safety-section__heading">
              <h2 id="guide-title">Dating safety guide</h2>
              <p>Calm, practical guidance from first chat to after the date.</p>
            </div>
            {GUIDE_SECTIONS.map(([title, body]) => (
              <details key={title}>
                <summary>{title}<ChevronRightIcon /></summary>
                <p>{body}</p>
              </details>
            ))}
          </section>

          <section className="safety-location">
            <MapPinIcon />
            <div><h2>Your exact location stays private</h2><p>DateZA uses your dating location for matching, but other members see safe place and distance information—not your coordinates.</p></div>
          </section>
        </main>

        <aside className="safety-rail">
          <section>
            <h2>Safety checklist</h2>
            <p>Know what DateZA can confirm today.</p>
            <ul>
              <li className={verified ? "is-complete" : ""}><CheckCircleIcon /><span><strong>{VERIFIED_CONTACT_LABEL}</strong><small>{verified ? "Your sign-in contact is verified." : "Complete contact verification in Settings."}</small></span></li>
              <li className={profileVisible ? "is-complete" : ""}><CheckCircleIcon /><span><strong>Profile visibility</strong><small>{profileVisible ? "Your profile can appear to others." : "Your profile is currently hidden."}</small></span></li>
              <li className="is-complete"><CheckCircleIcon /><span><strong>Block and report</strong><small>Available from a member&apos;s profile. From a chat, open their profile first.</small></span></li>
            </ul>
          </section>
          <section>
            <h2>Important to know</h2>
            <p>Protect your personal information and take conversations at your own pace.</p>
            <p>You can block or report someone whenever you feel uncomfortable.</p>
          </section>
          <section className="safety-urgent">
            <h2>Need urgent help?</h2>
            <p>If you&apos;re in immediate danger, contact local emergency services.</p>
            <strong>DateZA is not an emergency service.</strong>
          </section>
        </aside>
      </div>
    </div>
  );
}
