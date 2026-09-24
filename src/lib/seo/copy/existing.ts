import { SEO_RELEASE_DATE } from "../site.ts";
import type { SeoPage } from "../types.ts";

export const homePage: SeoPage = {
  path: "/",
  title: "DateZA — Dating in South Africa",
  description:
    "DateZA is a South African dating app. Join free, create a profile, and meet singles across the country — from Cape Town and Johannesburg to Durban and beyond.",
  h1: "Meet someone who chooses you.",
  eyebrow: "DateZA",
  intro:
    "DateZA is dating for South Africa. Create a profile, see people near you, like or pass, and take it offline when you are ready.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebSite", "Organization", "WebPage"],
  kind: "home",
  lastModified: SEO_RELEASE_DATE,
  blocks: [],
};

export const howItWorksPage: SeoPage = {
  path: "/how-it-works",
  title: "How DateZA Works | South African Dating",
  description:
    "How DateZA works: join free, create a profile, discover people in South Africa, like or pass, match, chat, and meet in real life.",
  h1: "Create a profile. Meet people. Take it from there.",
  eyebrow: "How it works",
  intro:
    "DateZA is the usual dating loop, built for South Africa: join, show yourself, discover, like, match, chat, then meet in real life.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "How it works", path: "/how-it-works" },
  ],
  related: [
    { path: "/about", label: "About DateZA" },
    { path: "/dating-safely", label: "Safety on DateZA" },
    { path: "/dating-advice/dating-profile-tips", label: "Profile tips" },
    { path: "/sign-up", label: "Create your profile" },
  ],
  faqs: [
    {
      question: "How does DateZA work?",
      answer:
        "You create a profile, see people in Discover or Find, like or pass, and chat when you both like each other. Then you decide whether to meet in public.",
    },
    {
      question: "Is DateZA free to join?",
      answer: "Yes. You can join DateZA free with your email or phone and set up a profile in the browser.",
    },
    {
      question: "Is DateZA available in South Africa?",
      answer:
        "Yes. DateZA is built for dating in South Africa. You set your city so you see people who date where you do.",
    },
  ],
  blocks: [
    {
      type: "h2",
      text: "Tell us about you",
    },
    {
      type: "p",
      text: "Join free, add photos, and share what you want. We only ask for what you need to start meeting people. [[Profile tips|/dating-advice/dating-profile-tips]] if you want a fuller first impression.",
    },
    {
      type: "h2",
      text: "See who’s around",
    },
    {
      type: "p",
      text: "Discover is a daily set of people. Find is there when you want to keep looking on your own terms. Like, pass, or send a first note where the product allows it. Set the city you actually date in — [[Cape Town|/dating/cape-town]], [[Johannesburg|/dating/johannesburg]], or elsewhere on the [[city list|/dating]].",
    },
    {
      type: "h2",
      text: "Match, chat, meet",
    },
    {
      type: "p",
      text: "When you both like each other, you can chat. Meet in public when you are ready — never send money, never rush off-app. [[Dating safely|/dating-safely]] explains block, report and unmatch. [[How to start a conversation|/dating-advice/how-to-start-a-conversation]] if the first line is the hard part.",
    },
    {
      type: "h2",
      text: "Who can use DateZA",
    },
    {
      type: "p",
      text: "Adults 18 and over. After you join, you can confirm your email or phone. RealMe selfie checks are not available yet. DateZA does not publish member counts or fake reviews — you will see real profiles only after you have an account.",
    },
  ],
};

export const datingSafelyPage: SeoPage = {
  path: "/dating-safely",
  title: "Dating Safely on DateZA | Safety",
  description:
    "DateZA safety: block, report and unmatch stay free. Practical advice for chatting and meeting in South Africa. For adults 18 and over.",
  h1: "Date like you have somewhere to be tomorrow.",
  eyebrow: "Safety",
  intro:
    "DateZA is for adults 18 and over. Block and report stay free, visible, and in your control. If something feels off, trust that.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Dating safely", path: "/dating-safely" },
  ],
  related: [
    { path: "/dating-advice/online-dating-safety", label: "Online dating safety tips" },
    { path: "/dating-advice/first-date-safety", label: "First date safety" },
    { path: "/privacy", label: "Privacy" },
    { path: "/how-it-works", label: "How DateZA works" },
  ],
  faqs: [
    {
      question: "What safety features does DateZA provide?",
      answer:
        "DateZA provides block and report on profiles and chats, unmatch for a dating relationship, contact verification after you join, and privacy controls so precise location and messages stay off public pages.",
    },
    {
      question: "Does DateZA verify identity with RealMe?",
      answer:
        "Not yet. You can confirm email or phone. RealMe selfie checks are planned and are not available today.",
    },
    {
      question: "How do I block or report someone?",
      answer:
        "After you sign in, open their profile or chat and use Block or Report. We do not tell the other person you reported them. Unmatch is a separate action from Block.",
    },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA actually provides",
    },
    {
      type: "ul",
      items: [
        "Block — they leave your dating surfaces.",
        "Report — a private report on a profile, photo, message, conversation, or opener.",
        "Unmatch — ends that match; it is not the same as a block.",
        "Contact verification — confirm email or phone after you join.",
        "Privacy controls — hide or close your account from Settings; precise location is not shown on public pages.",
      ],
    },
    {
      type: "p",
      text: "DateZA does not currently offer RealMe identity verification, an in-app emergency button, or a promise that every member has been screened by a human before you see them. We will not invent those claims.",
    },
    {
      type: "h2",
      text: "Before you meet",
    },
    {
      type: "p",
      text: "Chat first. Choose a public place. Arrange your own transport. Tell someone you trust where you are going. More detail: [[first date safety|/dating-advice/first-date-safety]] and [[first date ideas|/dating-advice/first-date-ideas-south-africa]].",
    },
    {
      type: "h2",
      text: "On the date",
    },
    {
      type: "p",
      text: "Keep your phone with you, watch your own drinks, and leave whenever you want. You never owe a second date.",
    },
    {
      type: "h2",
      text: "Online",
    },
    {
      type: "p",
      text: "Take your time. Be cautious if someone pressures you off DateZA, asks for money, or avoids ordinary questions. [[Online dating safety|/dating-advice/online-dating-safety]] covers the common scams.",
    },
    {
      type: "h2",
      text: "Block and report",
    },
    {
      type: "p",
      text: "Every profile and chat has block and report. After you join, they live in the Safety centre. We do not tell the other person you reported them. If you need the signed-in tools, [[sign in|/sign-in]] — or [[join first|/sign-up]] if you are new.",
    },
  ],
};

export const storiesPage: SeoPage = {
  path: "/stories",
  title: "Success Stories | DateZA",
  description:
    "DateZA is for people who want a real date, not a longer feed. No fake testimonials — just how meeting in South Africa is supposed to go.",
  h1: "The point is a real date, not a longer feed.",
  eyebrow: "Success stories",
  intro:
    "DateZA is for people who actually want to meet. The stories that matter happen after you close the app — coffee in Rosebank, a walk on the Sea Point promenade, a second date that was not supposed to happen.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "utility",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Stories", path: "/stories" },
  ],
  related: [
    { path: "/how-it-works", label: "How DateZA works" },
    { path: "/singles", label: "Meet South African singles" },
    { path: "/sign-up", label: "Create your profile" },
  ],
  blocks: [
    {
      type: "h2",
      text: "See someone worth meeting",
    },
    {
      type: "p",
      text: "A daily Discover set, or Find when you know what you want. Photos first. Then the details that actually matter. DateZA does not publish fake reviews, member counts, or named testimonials we cannot stand behind.",
    },
    {
      type: "h2",
      text: "Say hello like a person",
    },
    {
      type: "p",
      text: "Like, pass, or send an opener. When it is mutual, you chat. No performance, no endless swiping for its own sake. [[How to start a conversation|/dating-advice/how-to-start-a-conversation]] if you want a nudge.",
    },
    {
      type: "h2",
      text: "Take it offline",
    },
    {
      type: "p",
      text: "Meet in public. Keep it light. If it is a match in real life, you will know. If it is not, you still dated like an adult. [[Dating safely|/dating-safely]] before you go.",
    },
  ],
};

export const lifestylePage: SeoPage = {
  path: "/lifestyle",
  title: "SA Lifestyle | DateZA",
  description:
    "DateZA is for people who live in South Africa — city nights, beach days, road trips, food and live music — or who genuinely want to meet people who do.",
  h1: "Dates that look like this country.",
  eyebrow: "SA lifestyle",
  intro:
    "City nights, beach days, road trips, good food, live music. DateZA is for people who live here — or who genuinely want to meet people who do.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "utility",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "SA lifestyle", path: "/lifestyle" },
  ],
  related: [
    { path: "/south-african-dating", label: "South African dating" },
    { path: "/dating", label: "Dating by city" },
    { path: "/dating-advice/first-date-ideas-south-africa", label: "First date ideas" },
  ],
  blocks: [
    {
      type: "p",
      text: "A DateZA date might be a weeknight in Rosebank, a promenade walk in Sea Point, Florida Road in Durban, or a quieter table in Bloemfontein. The app does not invent a lifestyle for you — it introduces you to people who already have one.",
    },
    {
      type: "p",
      text: "If you want the dating context for a specific place, start with the [[city pages|/dating]]. For how the product works, see [[How it works|/how-it-works]].",
    },
  ],
};

export const privacyPage: SeoPage = {
  path: "/privacy",
  title: "Privacy | DateZA",
  description:
    "DateZA privacy: other members see what you put on your profile. Precise location, chats and reports stay off public pages and links.",
  h1: "Your dating life stays yours.",
  eyebrow: "Privacy",
  intro:
    "DateZA shows what you choose to put on your profile. We do not put precise location, private messages, or report details in links or public pages.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "utility",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Privacy", path: "/privacy" },
  ],
  related: [
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/help", label: "Help Centre" },
    { path: "/about", label: "About DateZA" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What other members see",
    },
    {
      type: "p",
      text: "Your public profile: photos, first name or display name, age, city, and what you chose to share. Not your email, phone, or exact pin.",
    },
    {
      type: "h2",
      text: "What stays private",
    },
    {
      type: "p",
      text: "Chats, reports, blocks, and account settings stay between you and DateZA. Block and report do not announce themselves to the other person.",
    },
    {
      type: "h2",
      text: "You’re in control",
    },
    {
      type: "p",
      text: "You can hide or close your account from Settings. Closing DateZA ends this membership. If you need help, use [[Help Centre|/help]] after you sign in — or [[join first|/sign-up]] if you are new.",
    },
  ],
};

export const helpPage: SeoPage = {
  path: "/help",
  title: "Help Centre | DateZA",
  description:
    "DateZA help: how to join, sign in, reset a password, use block and report, and close your account. For adults 18 and over.",
  h1: "How to get going — and how to get out if you need to.",
  eyebrow: "Help Centre",
  intro:
    "DateZA is a dating app for South Africa. You need to be 18 or older. Most answers live in the product once you have an account.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "utility",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Help", path: "/help" },
  ],
  related: [
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/privacy", label: "Privacy" },
    { path: "/how-it-works", label: "How DateZA works" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Create an account",
    },
    {
      type: "p",
      text: "[[Join free|/sign-up]] with your email or phone, then set up your profile.",
    },
    {
      type: "h2",
      text: "Already a member?",
    },
    {
      type: "p",
      text: "[[Sign in|/sign-in]]. Forgot your password? Use [[Forgot password|/forgot-password]].",
    },
    {
      type: "h2",
      text: "Feel unsafe",
    },
    {
      type: "p",
      text: "After you sign in, open a profile or chat and use Block or Report. Read [[dating safely|/dating-safely]] before you meet.",
    },
    {
      type: "h2",
      text: "Close your account",
    },
    {
      type: "p",
      text: "Sign in, go to Settings, and close your DateZA membership. That action is permanent for this brand.",
    },
  ],
};

export const careersPage: SeoPage = {
  path: "/careers",
  title: "Careers | DateZA",
  description: "DateZA careers. There are no open roles listed yet. When there are, they will appear here.",
  h1: "We’re building DateZA in South Africa.",
  eyebrow: "Careers",
  intro: "There aren’t open roles listed yet. When there are, they’ll show up here — not in a random inbox thread.",
  robots: "noindex, nofollow",
  sitemap: false,
  schemaTypes: ["WebPage"],
  kind: "utility",
  lastModified: SEO_RELEASE_DATE,
  blocks: [
    {
      type: "p",
      text: "If you just want to date, that is the product — jobs come later. [[Join DateZA|/sign-up]] or read [[about DateZA|/about]].",
    },
  ],
};

export const getTheAppPage: SeoPage = {
  path: "/get-the-app",
  title: "Get the App | DateZA",
  description:
    "DateZA is ready in your browser. Add it to your iPhone or Android home screen — there is no separate store listing yet.",
  h1: "DateZA is ready in your browser.",
  eyebrow: "Get DateZA",
  intro:
    "There’s no separate store listing yet. Open DateZA on your phone, join free, and use it like an app from the home screen.",
  robots: "noindex, nofollow",
  sitemap: false,
  schemaTypes: ["WebPage"],
  kind: "utility",
  lastModified: SEO_RELEASE_DATE,
  blocks: [
    {
      type: "p",
      text: "On iPhone, open Safari, tap Share, then Add to Home Screen. On Android, use Chrome’s Add to Home screen. Same DateZA. Same people. [[Join free|/sign-up]] when you are ready.",
    },
  ],
};
