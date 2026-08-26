import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PublicChrome } from "./PublicChrome.tsx";

const HOME_TITLE = "DateZA — Meet someone who chooses you.";

type Props = {
  title: string;
  documentTitle: string;
  eyebrow: string;
  intro: string;
  children: ReactNode;
};

export function MarketingArticle({ title, documentTitle, eyebrow, intro, children }: Props) {
  useEffect(() => {
    document.title = documentTitle;
    return () => {
      document.title = HOME_TITLE;
    };
  }, [documentTitle]);

  return (
    <PublicChrome>
      <main className="public-article" id="main-content">
        <p className="public-article__eyebrow">{eyebrow}</p>
        <h1 className="public-article__title">{title}</h1>
        <p className="public-article__intro">{intro}</p>
        {children}
        <p className="public-article__cta-row">
          <Link className="public-article__cta" to="/sign-up">
            Join DateZA free
          </Link>
        </p>
      </main>
    </PublicChrome>
  );
}

export function HowItWorksPage() {
  return (
    <MarketingArticle
      eyebrow="How it works"
      title="Create a profile. Meet people. Take it from there."
      documentTitle="How it works — DateZA"
      intro="DateZA is the usual dating loop, built for South Africa: join, show yourself, discover, like, match, chat, then meet in real life."
    >
      <ol className="public-article__steps">
        <li>
          <h2>Tell us about you</h2>
          <p>Join free, add photos, and share what you want. We only ask for what you need to start meeting people.</p>
        </li>
        <li>
          <h2>See who’s around</h2>
          <p>Discover a daily set of people, or Find on your own terms. Like, pass, or send a first note.</p>
        </li>
        <li>
          <h2>Match, chat, meet</h2>
          <p>When you both like each other, you can chat. Meet in public when you’re ready — never send money, never rush off-app.</p>
        </li>
      </ol>
    </MarketingArticle>
  );
}

export function DatingSafelyPage() {
  return (
    <MarketingArticle
      eyebrow="Safety"
      title="Date like you have somewhere to be tomorrow."
      documentTitle="Dating safely — DateZA"
      intro="DateZA is for adults 18 and over. Block and report stay free, visible, and in your control. If something feels off, trust that."
    >
      <ul className="public-article__list">
        <li>
          <h2>Before you meet</h2>
          <p>Chat first. Choose a public place. Arrange your own transport. Tell someone you trust where you’re going.</p>
        </li>
        <li>
          <h2>On the date</h2>
          <p>Keep your phone with you, watch your own drinks, and leave whenever you want. You never owe a second date.</p>
        </li>
        <li>
          <h2>Online</h2>
          <p>Take your time. Be cautious if someone pressures you off DateZA, asks for money, or avoids ordinary questions.</p>
        </li>
        <li>
          <h2>Block and report</h2>
          <p>Every profile and chat has block and report. After you join, they’re in the Safety centre. We don’t tell the other person you reported them.</p>
        </li>
      </ul>
    </MarketingArticle>
  );
}

export function StoriesPage() {
  return (
    <MarketingArticle
      eyebrow="Success stories"
      title="The point is a real date, not a longer feed."
      documentTitle="Success stories — DateZA"
      intro="DateZA is for people who actually want to meet. The stories that matter happen after you close the app — coffee in Rosebank, a walk on the Sea Point promenade, a second date that wasn’t supposed to happen."
    >
      <ul className="public-article__list">
        <li>
          <h2>See someone worth meeting</h2>
          <p>A daily Discover set, or Find when you know what you want. Photos first. Then the details that actually matter.</p>
        </li>
        <li>
          <h2>Say hello like a person</h2>
          <p>Like, pass, or send an opener. When it’s mutual, you chat. No performance, no endless swiping for its own sake.</p>
        </li>
        <li>
          <h2>Take it offline</h2>
          <p>Meet in public. Keep it light. If it’s a match in real life, you’ll know. If it isn’t, you still dated like an adult.</p>
        </li>
      </ul>
    </MarketingArticle>
  );
}

export function LifestylePage() {
  return (
    <MarketingArticle
      eyebrow="SA lifestyle"
      title="Dates that look like this country."
      documentTitle="SA lifestyle — DateZA"
      intro="City nights, beach days, road trips, good food, live music. DateZA is for people who live here — or who genuinely want to meet people who do."
    >
      <div className="public-mosaic">
        {[
          ["/images/lifestyle/city-nights.webp", "City nights"],
          ["/images/lifestyle/beach-days.webp", "Beach days"],
          ["/images/lifestyle/road-trips.webp", "Road trips"],
          ["/images/lifestyle/good-food.webp", "Good food"],
          ["/images/lifestyle/live-events.webp", "Live events"],
        ].map(([src, label]) => (
          <figure key={src} className="public-mosaic__card">
            <img className="dz-img" src={src} alt="" />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
    </MarketingArticle>
  );
}

export function PrivacyPage() {
  return (
    <MarketingArticle
      eyebrow="Privacy"
      title="Your dating life stays yours."
      documentTitle="Privacy — DateZA"
      intro="DateZA shows what you choose to put on your profile. We don’t put precise location, private messages, or report details in links or public pages."
    >
      <ul className="public-article__list">
        <li>
          <h2>What other members see</h2>
          <p>Your public profile: photos, first name or display name, age, city, and what you chose to share. Not your email, phone, or exact pin.</p>
        </li>
        <li>
          <h2>What stays private</h2>
          <p>Chats, reports, blocks, and account settings stay between you and DateZA. Block and report don’t announce themselves to the other person.</p>
        </li>
        <li>
          <h2>You’re in control</h2>
          <p>You can hide or close your account from Settings. Closing DateZA ends this membership. If you need help, use Help Centre after you sign in — or join first if you’re new.</p>
        </li>
      </ul>
    </MarketingArticle>
  );
}

export function HelpPage() {
  return (
    <MarketingArticle
      eyebrow="Help Centre"
      title="How to get going — and how to get out if you need to."
      documentTitle="Help Centre — DateZA"
      intro="DateZA is a dating app for South Africa. You need to be 18 or older. Most answers live in the product once you have an account."
    >
      <ul className="public-article__list">
        <li>
          <h2>Create an account</h2>
          <p>
            <Link to="/sign-up">Join free</Link> with your email or phone, then set up your profile.
          </p>
        </li>
        <li>
          <h2>Already a member?</h2>
          <p>
            <Link to="/sign-in">Sign in</Link>. Forgot your password? Use{" "}
            <Link to="/forgot-password">Forgot password</Link>.
          </p>
        </li>
        <li>
          <h2>Feel unsafe</h2>
          <p>
            After you sign in, open a profile or chat and use Block or Report. Read{" "}
            <Link to="/dating-safely">dating safely</Link> before you meet.
          </p>
        </li>
        <li>
          <h2>Close your account</h2>
          <p>Sign in, go to Settings, and close your DateZA membership. That action is permanent for this brand.</p>
        </li>
      </ul>
    </MarketingArticle>
  );
}

export function CareersPage() {
  return (
    <MarketingArticle
      eyebrow="Careers"
      title="We’re building DateZA in South Africa."
      documentTitle="Careers — DateZA"
      intro="There aren’t open roles listed yet. When there are, they’ll show up here — not in a random inbox thread."
    >
      <p>If you just want to date, that’s the product — jobs come later.</p>
    </MarketingArticle>
  );
}

export function CitiesPage() {
  return (
    <MarketingArticle
      eyebrow="Cities"
      title="Across SA, people are actually going out."
      documentTitle="Cities — DateZA"
      intro="Cape Town, Johannesburg, Durban, Pretoria, Gqeberha, Bloemfontein — and everywhere in between. Join, set your city, and see who’s nearby."
    >
      <div className="public-mosaic public-mosaic--cities">
        {[
          ["/images/places/cape-town.webp", "Cape Town"],
          ["/images/places/johannesburg.webp", "Johannesburg"],
          ["/images/places/durban.webp", "Durban"],
          ["/images/places/pretoria.webp", "Pretoria"],
          ["/images/places/gqeberha.webp", "Gqeberha"],
          ["/images/places/bloemfontein.webp", "Bloemfontein"],
        ].map(([src, label]) => (
          <figure key={src} className="public-mosaic__card">
            <img className="dz-img" src={src} alt="" />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
    </MarketingArticle>
  );
}

export function GetTheAppPage() {
  return (
    <MarketingArticle
      eyebrow="Get DateZA"
      title="DateZA is ready in your browser."
      documentTitle="Get the app — DateZA"
      intro="There’s no separate store listing yet. Open DateZA on your phone, join free, and use it like an app from the home screen."
    >
      <p>
        On iPhone, open Safari, tap Share, then Add to Home Screen. On Android, use Chrome’s Add to Home screen. Same DateZA. Same people.
      </p>
    </MarketingArticle>
  );
}
