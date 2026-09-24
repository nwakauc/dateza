import { SEO_RELEASE_DATE } from "../site.ts";
import type { SeoPage } from "../types.ts";

const adviceCrumb = { name: "Dating advice", path: "/dating-advice" } as const;

export const onlineDatingSaPage: SeoPage = {
  path: "/dating-advice/online-dating-south-africa",
  title: "Online Dating in South Africa | DateZA Advice",
  description:
    "How online dating works in South Africa: what to expect on DateZA, how to pace chats, and how to move from the app to a public date.",
  h1: "Online dating in South Africa, at a human pace.",
  eyebrow: "Dating advice",
  intro:
    "Apps here run on the same hopes as anywhere else, plus load shedding, long drives, and a healthy suspicion of strangers. This is how to use DateZA without treating it like a slot machine.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "Online dating in South Africa", path: "/dating-advice/online-dating-south-africa" },
  ],
  related: [
    { path: "/dating-advice/dating-profile-tips", label: "Dating profile tips" },
    { path: "/dating-advice/online-dating-safety", label: "Online dating safety" },
    { path: "/south-african-dating", label: "South African dating" },
    { path: "/dating", label: "Dating by city" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What “online dating” means on DateZA",
    },
    {
      type: "p",
      text: "You are not browsing a public catalogue of the nation. You join, you set a city, and you see people who are also on DateZA. [[How it works|/how-it-works]] is the loop: profile, Discover or Find, like or pass, chat when it is mutual, meet when you choose.",
    },
    {
      type: "h2",
      text: "Pace that survives this country",
    },
    {
      type: "p",
      text: "A good week is a few honest likes and one conversation that could become coffee — not two hundred swipes. If you live in [[Johannesburg|/dating/johannesburg]], logistics will eat matches that never name a suburb. In [[Cape Town|/dating/cape-town]], wind and distance do the same. Say where you are. Suggest a public place while the chat still has energy.",
    },
    {
      type: "h2",
      text: "What to put in writing",
    },
    {
      type: "ul",
      items: [
        "Photos from this year that look like you in ordinary light.",
        "A city and, if it matters, a suburb or side of town.",
        "What you want — casual, serious, or still deciding — in words you can repeat in person.",
        "One specific (amapiano, trail running, church on Sunday, night shifts) so the first message has a handle.",
      ],
    },
    {
      type: "h2",
      text: "When to leave the app",
    },
    {
      type: "p",
      text: "Stay on DateZA until you have a first name, a public venue, and a time. Then take the number if you want. Moving to WhatsApp in the first five messages is a common pressure move — you can refuse. Read [[online dating safety|/dating-advice/online-dating-safety]] and keep [[block and report|/dating-safely]] visible.",
    },
    {
      type: "h2",
      text: "What DateZA will not do for you",
    },
    {
      type: "p",
      text: "It will not guarantee a match, a marriage, or a verified government identity. Contact can be confirmed. RealMe checks are not live. You still choose who you meet, and you still leave if the table feels wrong.",
    },
  ],
};

export const firstDateIdeasPage: SeoPage = {
  path: "/dating-advice/first-date-ideas-south-africa",
  title: "First Date Ideas in South Africa | DateZA",
  description:
    "First date ideas that work in South Africa: short, public, easy to leave — from Joburg malls to Cape Town promenades and Durban daylight walks.",
  h1: "First date ideas that survive a South African Saturday.",
  eyebrow: "Dating advice",
  intro:
    "The best first dates here are short, public, and close to a way home you control. Pick something you can end after 45 minutes without a speech.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "First date ideas", path: "/dating-advice/first-date-ideas-south-africa" },
  ],
  related: [
    { path: "/dating-advice/first-date-safety", label: "First date safety" },
    { path: "/dating/cape-town", label: "Dating in Cape Town" },
    { path: "/dating/johannesburg", label: "Dating in Johannesburg" },
    { path: "/dating/durban", label: "Dating in Durban" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Rules before the idea",
    },
    {
      type: "ol",
      items: [
        "Daylight if you have not met. Early evening only in a place you already know.",
        "You travel there yourself. They travel themselves.",
        "Name the suburb in the chat so nobody is surprised by a 40-minute drive.",
        "Have a sentence ready for leaving: “I’m going to head off — thanks for the coffee.”",
      ],
    },
    {
      type: "h2",
      text: "Ideas that work in more than one city",
    },
    {
      type: "ul",
      items: [
        "Coffee in a busy café with an obvious door.",
        "A walk in a public park or promenade while it is light, then one drink if it is going well.",
        "A market hour — Neighbourgoods-style in Joburg, Oranjezicht-style in Cape Town, a Durban flea — not a full-day commitment.",
        "A gallery or museum with a café attached. Easy to talk, easy to exit.",
        "Ice cream or a juice after a short walk. Low alcohol, low pressure.",
      ],
    },
    {
      type: "h2",
      text: "City-shaped options",
    },
    {
      type: "p",
      text: "In [[Cape Town|/dating/cape-town]], Sea Point promenade or Company’s Garden beats a first-date drive to a wine farm. In [[Johannesburg|/dating/johannesburg]], Parkhurst, 44 Stanley, or a Rosebank coffee beats “come through to my complex”. In [[Pretoria|/dating/pretoria]], Brooklyn or Menlyn Maine in the day is enough. In [[Durban|/dating/durban]], keep the first meet on a public stretch you trust. In [[Gqeberha|/dating/gqeberha]] and [[Bloemfontein|/dating/bloemfontein]], smaller cities still deserve public tables — not “my friend’s empty flat”.",
    },
    {
      type: "h2",
      text: "Ideas to skip on date one",
    },
    {
      type: "ul",
      items: [
        "Hiking a quiet trail you do not know.",
        "A long dinner with a tasting menu and no exit.",
        "Their home, your home, or an Airbnb.",
        "A club where you cannot hear a no.",
      ],
    },
    {
      type: "p",
      text: "For the safety version of this list, read [[first date safety|/dating-advice/first-date-safety]]. When you are ready to use the ideas, [[join DateZA|/sign-up]].",
    },
  ],
};

export const onlineSafetyAdvicePage: SeoPage = {
  path: "/dating-advice/online-dating-safety",
  title: "Online Dating Safety | DateZA Advice",
  description:
    "Practical online dating safety for South Africa: money scams, pressure off the app, photos, and how DateZA block and report fit in.",
  h1: "Online dating safety, without the scare lecture.",
  eyebrow: "Dating advice",
  intro:
    "Most chats are ordinary. The dangerous ones rhyme. This page is the pattern-recognition version — and what DateZA actually lets you do about it.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "Online dating safety", path: "/dating-advice/online-dating-safety" },
  ],
  related: [
    { path: "/dating-safely", label: "Safety features on DateZA" },
    { path: "/dating-advice/first-date-safety", label: "First date safety" },
    { path: "/privacy", label: "Privacy on DateZA" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA provides — and what it does not",
    },
    {
      type: "p",
      text: "On DateZA you can [[block, report and unmatch|/dating-safely]]. Reports stay private from the other person. After you join, you can confirm email or phone. There is no live RealMe identity check, no claim of encryption theatre, and no promise that every photo has been human-reviewed before you see it.",
    },
    {
      type: "h2",
      text: "Money is the loudest red flag",
    },
    {
      type: "p",
      text: "Nobody you met this week needs airtime, data, Bitcoin, a school-fee emergency, or a “temporary” EFT to release a package. Investment talk in a dating chat is not a meet-cute. End it. Report it. Do not explain yourself into a second payment.",
    },
    {
      type: "h2",
      text: "Pressure off the app",
    },
    {
      type: "p",
      text: "“WhatsApp is easier” in the first hour is often about leaving a place with receipts. You can stay on DateZA until you have met in public. If they sulk, that is information. If they send a new number every day, that is more information.",
    },
    {
      type: "h2",
      text: "Photos, stories, and time zones",
    },
    {
      type: "ul",
      items: [
        "Only professional-model photos and a bio with no city specifics — slow down.",
        "They avoid a video hello after you have already offered a public coffee — slow down.",
        "They claim to be in your city but only chat at odd hours and never meet — ask once, then stop.",
        "They want nudes quickly, or they want yours as “proof” — you owe them nothing.",
      ],
    },
    {
      type: "h2",
      text: "What you should never send",
    },
    {
      type: "p",
      text: "Home address, workplace roster, OTPs, copies of your ID, or banking details. DateZA support will not ask for your password in a chat. If a profile or message feels wrong, use report. Then read [[first date safety|/dating-advice/first-date-safety]] before you agree to meet the people who do seem real.",
    },
  ],
};

export const profileTipsPage: SeoPage = {
  path: "/dating-advice/dating-profile-tips",
  title: "Dating Profile Tips | DateZA",
  description:
    "Dating profile tips for DateZA: photos, bios, and details that help South African matches know who they are meeting.",
  h1: "Write a DateZA profile you would stand by in person.",
  eyebrow: "Dating advice",
  intro:
    "Your profile is not a CV and it is not a joke account. It is the first honest page of a date. These tips are for DateZA in South Africa — not a generic US template.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "Profile tips", path: "/dating-advice/dating-profile-tips" },
  ],
  related: [
    { path: "/how-it-works", label: "How DateZA works" },
    { path: "/dating-advice/how-to-start-a-conversation", label: "How to start a conversation" },
    { path: "/sign-up", label: "Create your profile" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Photos that do the job",
    },
    {
      type: "ul",
      items: [
        "A clear face photo in ordinary light — not only a festival crop from 2019.",
        "A full-body photo so nobody is surprised at the table.",
        "One photo that shows how you actually spend time: a trail, a kitchen, a match, a church dress, a work-from-home desk.",
        "Skip the sunglasses-only set and the group shot where nobody can tell which one you are.",
      ],
    },
    {
      type: "h2",
      text: "Words that help a match start",
    },
    {
      type: "p",
      text: "Name a city and, if you date in a metro, a side of town. [[Cape Town|/dating/cape-town]] “Atlantic or southern” saves a week. [[Johannesburg|/dating/johannesburg]] “East Rand / North / Soweto” does the same. Mention a language you like to date in if that matters to you. Say whether you want something casual, serious, or you are still figuring it out — in a sentence, not a manifesto.",
    },
    {
      type: "h2",
      text: "Prompts without the cringe",
    },
    {
      type: "p",
      text: "Answer like you talk. “I will drive to Zoo Lake but I will not do a first date in a complex” is more useful than “I love to laugh”. If DateZA shows prompts, pick the ones you can finish in one breath. Empty prompts look like an empty Sunday.",
    },
    {
      type: "h2",
      text: "What to leave off",
    },
    {
      type: "p",
      text: "Do not put your workplace, your child’s school, or your exact street. Do not use the bio to insult other people’s bodies. Do not paste a political speech unless you want only that conversation. Privacy details live in [[Privacy|/privacy]]; safety tools live in [[dating safely|/dating-safely]].",
    },
    {
      type: "p",
      text: "When the profile is good enough to show a friend, [[join or finish setup|/sign-up]] and go see people. A perfect bio that never publishes is not dating.",
    },
  ],
};

export const conversationPage: SeoPage = {
  path: "/dating-advice/how-to-start-a-conversation",
  title: "How to Start a Conversation | DateZA",
  description:
    "How to start a conversation on DateZA: openers that refer to the profile, pacing, and when to suggest a real-life date in South Africa.",
  h1: "Start the chat like you might actually meet.",
  eyebrow: "Dating advice",
  intro:
    "“Hey” is a shrug. You do not need a routine — you need one sentence that proves you looked, and a second sentence that offers a path to a public table.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "How to start a conversation", path: "/dating-advice/how-to-start-a-conversation" },
  ],
  related: [
    { path: "/dating-advice/dating-profile-tips", label: "Dating profile tips" },
    { path: "/dating-advice/first-date-ideas-south-africa", label: "First date ideas" },
    { path: "/singles", label: "Meet South African singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Open on something they wrote",
    },
    {
      type: "p",
      text: "If they mentioned hiking above Muizenberg, ask which side they start from. If they mentioned amapiano, ask for one track, not a lecture. If they mentioned church, do not open with a joke about it unless you are sure. Specific beats clever.",
    },
    {
      type: "h2",
      text: "What good pacing looks like",
    },
    {
      type: "ul",
      items: [
        "A question they can answer in one line, then you answer something too.",
        "No interview clipboard. No novel on message one.",
        "If they reply in kind, suggest a public place by message five to ten — sooner if the chat is easy.",
        "If they only send one word for three days, you can stop.",
      ],
    },
    {
      type: "h2",
      text: "Lines that usually fail here",
    },
    {
      type: "p",
      text: "Compliments only on the body. “I’m not like other guys/girls.” Immediate sexual pressure. Mocking their city. Asking them to prove they are real with a nude. If you matched in [[Durban|/dating/durban]] or [[Bloemfontein|/dating/bloemfontein]], remember the pool is smaller — people talk.",
    },
    {
      type: "h2",
      text: "Moving toward a date",
    },
    {
      type: "p",
      text: "Offer one concrete option: “Coffee in Rosebank on Thursday after work?” is kinder than “We should hang sometime.” Use [[first date ideas|/dating-advice/first-date-ideas-south-africa]] if you are stuck. If the chat feels off, you do not owe a closer — [[block or unmatch|/dating-safely]] and go back to Discover.",
    },
  ],
};

export const firstDateSafetyPage: SeoPage = {
  path: "/dating-advice/first-date-safety",
  title: "First Date Safety | DateZA Advice",
  description:
    "First date safety in South Africa: public places, your own transport, check-ins, and how to leave. Includes what DateZA’s safety tools cover.",
  h1: "Meet like you have somewhere to be tomorrow.",
  eyebrow: "Dating advice",
  intro:
    "A first date is a short public meeting between two adults who still barely know each other. Treat it that way and most of the safety work is already done.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "First date safety", path: "/dating-advice/first-date-safety" },
  ],
  related: [
    { path: "/dating-safely", label: "DateZA safety centre basics" },
    { path: "/dating-advice/online-dating-safety", label: "Online dating safety" },
    { path: "/dating-advice/first-date-ideas-south-africa", label: "First date ideas" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Before you leave home",
    },
    {
      type: "ul",
      items: [
        "Tell someone the name you have, the place, and the time.",
        "Share a live location with a trusted person if that is your habit — not with the match.",
        "Charge your phone. Carry airtime or data that does not depend on their hotspot.",
        "Plan your own taxi, lift, or car. Do not accept “I’ll fetch you” on date one.",
      ],
    },
    {
      type: "h2",
      text: "At the table — or on the walk",
    },
    {
      type: "p",
      text: "Meet in a staffed, public place. Keep your drink in sight. You can leave at any time, including before the coffee arrives. You do not need a story that protects their feelings more than your nerves. If they push a second venue that is quieter or private, you can say no and go.",
    },
    {
      type: "h2",
      text: "After",
    },
    {
      type: "p",
      text: "Check in with the person who knew your plan. If you want a second date, say so on DateZA. If you do not, a short clear message is enough. If they harass you after, [[block and report|/dating-safely]]. Unmatch ends the dating relationship; block is for when you need them out of your product.",
    },
    {
      type: "h2",
      text: "What DateZA can and cannot do on the night",
    },
    {
      type: "p",
      text: "DateZA cannot sit at the table with you. It can keep the chat history, accept a report, and honour a block. There is no in-app panic button and no live identity badge yet. Pair this page with [[online dating safety|/dating-advice/online-dating-safety]] before you agree to meet.",
    },
  ],
};

export const longDistancePage: SeoPage = {
  path: "/dating-advice/long-distance-dating-south-africa",
  title: "Long-Distance Dating in South Africa | DateZA",
  description:
    "Long-distance and intercity dating in South Africa: Cape Town–Joburg, Pretoria commutes, and how to use DateZA without living in a maybe.",
  h1: "Dating across South African distances.",
  eyebrow: "Dating advice",
  intro:
    "This country is large, flights are a budget line, and the N1 is not a love language. If you are going to date between cities, decide the calendar on purpose.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["Article", "WebPage", "BreadcrumbList"],
  kind: "article",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    adviceCrumb,
    { name: "Long-distance dating", path: "/dating-advice/long-distance-dating-south-africa" },
  ],
  related: [
    { path: "/dating/cape-town", label: "Dating in Cape Town" },
    { path: "/dating/johannesburg", label: "Dating in Johannesburg" },
    { path: "/dating/pretoria", label: "Dating in Pretoria" },
    { path: "/dating-advice/how-to-start-a-conversation", label: "How to start a conversation" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Name the distance",
    },
    {
      type: "p",
      text: "Pretoria–Midrand–Sandton is a commute argument. Cape Town–Johannesburg is a diary argument. Durban–Gqeberha is a long weekend argument. Bloemfontein to anywhere is a plan, not a vibe. Put your real city on DateZA. If you visit another city monthly, say so — do not set a city you do not live in just to see more faces.",
    },
    {
      type: "h2",
      text: "What to agree in the first week of chat",
    },
    {
      type: "ul",
      items: [
        "When you can next be in the same city, with a rough date.",
        "Who travels first, if that matters to you.",
        "Whether you are open to something that stays digital for a while — and for how long.",
        "A public first meeting, same as any other DateZA match. Distance is not a reason to skip [[first date safety|/dating-advice/first-date-safety]].",
      ],
    },
    {
      type: "h2",
      text: "Patterns that waste months",
    },
    {
      type: "p",
      text: "Nightly voice notes and zero calendar. “I’ll be in your city soon” with no month. Asking for money toward a flight. Refusing a video hello after two weeks of intimacy-by-text. If the story needs a hospital, a mine, or a stuck passport, read [[online dating safety|/dating-advice/online-dating-safety]] and stop.",
    },
    {
      type: "h2",
      text: "Using DateZA well anyway",
    },
    {
      type: "p",
      text: "Keep the conversation on DateZA until you have met, even if you already bought a flight. Use Discover in the city you are standing in. When the visit ends, be explicit: continue, pause, or unmatch. [[How DateZA works|/how-it-works]] does not change because of a boarding pass.",
    },
  ],
};

export const advicePages: SeoPage[] = [
  onlineDatingSaPage,
  firstDateIdeasPage,
  onlineSafetyAdvicePage,
  profileTipsPage,
  conversationPage,
  firstDateSafetyPage,
  longDistancePage,
];
