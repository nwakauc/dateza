import { SEO_RELEASE_DATE } from "../site.ts";
import type { SeoPage } from "../types.ts";

export const southAfricanDatingPage: SeoPage = {
  path: "/south-african-dating",
  title: "South African Dating | DateZA",
  description:
    "DateZA is built for dating in South Africa. Meet people across cities, cultures and languages — then take it offline when you are ready.",
  h1: "South African dating, without the imported playbook.",
  eyebrow: "Dating in South Africa",
  intro:
    "DateZA is a dating app for people who live here, or who genuinely want to meet people who do. The loop is ordinary on purpose: profile, discover, like, match, chat, meet.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "South African dating", path: "/south-african-dating" },
  ],
  related: [
    { path: "/singles", label: "Meet South African singles" },
    { path: "/dating", label: "Dating by city" },
    { path: "/how-it-works", label: "How DateZA works" },
    { path: "/dating-safely", label: "Dating safely on DateZA" },
    { path: "/dating-advice", label: "Dating advice" },
  ],
  faqs: [
    {
      question: "What is DateZA?",
      answer:
        "DateZA is a South African dating app. You create a profile, see people nearby, like or pass, and chat when it is mutual.",
    },
    {
      question: "Is DateZA only for people in South Africa?",
      answer:
        "DateZA is built for dating in South Africa. People outside the country can join if they genuinely want to meet people here.",
    },
    {
      question: "How do I start dating on DateZA?",
      answer:
        "Join free, set up your profile, and start with Discover or Find. When you both like each other, you can chat and arrange a real-life date.",
    },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is",
    },
    {
      type: "p",
      text: "DateZA is not a social network pretending to be dating, and it is not a tourism brochure. It is a place to meet [[South African singles|/singles]] and decide, at a human pace, whether you want to see each other in real life.",
    },
    {
      type: "p",
      text: "The product stays simple: join, show yourself honestly, see a daily set of people, like or pass, and talk when it is mutual. [[How DateZA works|/how-it-works]] is that loop, not a maze of settings.",
    },
    {
      type: "h2",
      text: "Who this is for",
    },
    {
      type: "p",
      text: "People 18 and over who want to date — casually, seriously, or something in between that you can say out loud. That includes people in [[Cape Town|/dating/cape-town]], [[Johannesburg|/dating/johannesburg]], [[Pretoria|/dating/pretoria]], [[Durban|/dating/durban]], [[Gqeberha|/dating/gqeberha]], [[Bloemfontein|/dating/bloemfontein]], and the towns and suburbs between them.",
    },
    {
      type: "p",
      text: "It also includes South Africans who have moved around, and people from elsewhere who are actually here — not someone collecting matches from another continent for sport.",
    },
    {
      type: "h2",
      text: "Dating here is its own thing",
    },
    {
      type: "p",
      text: "South Africa is not one dating scene. A Friday in Melville does not look like a Saturday on the Golden Mile. Load shedding, distance, languages, and family expectations all shape how people meet. DateZA does not flatten that into a generic “global dating” script.",
    },
    {
      type: "p",
      text: "You will see first names, photos, age, city, and what someone chose to share. You will not see their exact pin, their private messages, or a public pile of gossip. Read [[dating safely|/dating-safely]] before you meet, and keep block and report where you can reach them.",
    },
    {
      type: "h2",
      text: "How people actually use DateZA",
    },
    {
      type: "ol",
      items: [
        "Create a free account and a profile you would stand by in person.",
        "See who is around in Discover, or browse on your own terms in Find.",
        "Like, pass, or send a first note where the product allows it.",
        "When it is mutual, chat. When you are ready, meet in public.",
      ],
    },
    {
      type: "p",
      text: "If you want practical help before you join, start with [[online dating in South Africa|/dating-advice/online-dating-south-africa]] or [[profile tips|/dating-advice/dating-profile-tips]].",
    },
  ],
};

export const singlesPage: SeoPage = {
  path: "/singles",
  title: "South African Singles | DateZA",
  description:
    "Meet South African singles on DateZA. Join free, set your city, and start with people who are actually looking to date.",
  h1: "Meet South African singles who want a real date.",
  eyebrow: "South African singles",
  intro:
    "DateZA is for single adults who want to meet people in South Africa — not to collect a feed. Join free, say what you are looking for, and start with the people near you.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Singles", path: "/singles" },
  ],
  related: [
    { path: "/south-african-dating", label: "South African dating" },
    { path: "/dating", label: "Find singles by city" },
    { path: "/dating-advice/how-to-start-a-conversation", label: "How to start a conversation" },
    { path: "/sign-up", label: "Create your profile" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Who you will meet",
    },
    {
      type: "p",
      text: "DateZA is for people 18 and over. You set your city and what you want, then see members who are also using the app to date. There is no public member directory and no fake “singles near you” gallery — profiles appear after you join, from people who are actually on DateZA.",
    },
    {
      type: "h2",
      text: "Singles across the country",
    },
    {
      type: "p",
      text: "Looking in a specific place? Start with [[dating in Cape Town|/dating/cape-town]], [[Johannesburg singles|/dating/johannesburg]], [[Pretoria|/dating/pretoria]], [[Durban|/dating/durban]], [[Gqeberha|/dating/gqeberha]], or [[Bloemfontein|/dating/bloemfontein]]. The [[city hub|/dating]] lists them together.",
    },
    {
      type: "p",
      text: "If you live between cities, or you date in more than one, say so on your profile. South African dating is full of people who work in Sandton and spend weekends in the Cape, or who moved for university and never quite picked a single “home” city.",
    },
    {
      type: "h2",
      text: "What to do after you join",
    },
    {
      type: "ul",
      items: [
        "Add recent photos that look like you on a normal day.",
        "Write a few specifics — a suburb, a hobby, a kind of date you actually enjoy.",
        "Use Discover for a daily set, or Find when you want to keep looking.",
        "When you match, suggest a public place. [[First date ideas|/dating-advice/first-date-ideas-south-africa]] can help.",
      ],
    },
    {
      type: "p",
      text: "DateZA does not publish member counts or success-story scores. If someone feels off, [[block and report stay free|/dating-safely]].",
    },
  ],
};

export const datingHubPage: SeoPage = {
  path: "/dating",
  title: "Online Dating in South Africa | DateZA",
  description:
    "Online dating in South Africa with DateZA. See how the app works, then browse dating in Cape Town, Johannesburg, Pretoria, Durban and more.",
  h1: "Dating in South Africa, city by city.",
  eyebrow: "Online dating",
  intro:
    "DateZA is the dating app — Discover, like, match, chat. Use this page to find dating in your city, or start with how the product works.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Dating", path: "/dating" },
  ],
  related: [
    { path: "/south-african-dating", label: "South African dating" },
    { path: "/singles", label: "South African singles" },
    { path: "/how-it-works", label: "How DateZA works" },
    { path: "/dating-advice", label: "Dating advice" },
  ],
  blocks: [
    {
      type: "h2",
      text: "A dating app, not a city brochure",
    },
    {
      type: "p",
      text: "Each city page is here because dating feels different in that place — distances, weekends, weather, and where people actually go out. They are not copies of each other with the name swapped.",
    },
    {
      type: "p",
      text: "DateZA itself stays the same wherever you set your city: [[create a profile|/how-it-works]], see people, and take it offline when you are ready. For national context, read [[South African dating|/south-african-dating]].",
    },
    {
      type: "h2",
      text: "Before you pick a city",
    },
    {
      type: "ul",
      items: [
        "You need to be 18 or older.",
        "Join free, then set the city you actually date in.",
        "If you split time between cities, be honest on your profile.",
        "Meet in public. Keep [[safety|/dating-safely]] in reach.",
      ],
    },
  ],
};

export const aboutPage: SeoPage = {
  path: "/about",
  title: "About DateZA | South African Dating",
  description:
    "DateZA is a dating app for South Africa. Learn what it is, who it is for, how people use it, and how to join.",
  h1: "DateZA is dating for South Africa.",
  eyebrow: "About DateZA",
  intro:
    "DateZA is a modern dating app built for South Africa and for people who want to date people here. The product is intentionally easy to understand: discover, like, match, chat, meet.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList", "FAQPage"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],
  related: [
    { path: "/how-it-works", label: "How DateZA works" },
    { path: "/dating-safely", label: "Safety on DateZA" },
    { path: "/south-african-dating", label: "South African dating" },
    { path: "/sign-up", label: "Create your profile" },
  ],
  faqs: [
    {
      question: "What is DateZA?",
      answer:
        "DateZA is a South African dating app. Members create a profile, discover people, like or pass, and chat when both people like each other.",
    },
    {
      question: "What does DateZA do?",
      answer:
        "DateZA helps adults meet for dating in South Africa. It is the usual dating loop — profile, discover, match, chat, meet — with block, report, unmatch and contact verification available in the product.",
    },
    {
      question: "Who is DateZA for?",
      answer:
        "Adults 18 and over who want to date people in South Africa. That includes people across cities, cultures, languages and relationship intentions.",
    },
    {
      question: "How can someone join DateZA?",
      answer:
        "Open DateZA in your browser, join free with email or phone, then set up your profile. There is no separate store listing yet.",
    },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is",
    },
    {
      type: "p",
      text: "DateZA is a dating app. You join, add photos, and share enough to start meeting people. You see a daily Discover set, or use Find when you want to keep looking. Mutual likes become a match. Then you chat and, if it still feels right, you meet.",
    },
    {
      type: "h2",
      text: "What DateZA is not",
    },
    {
      type: "p",
      text: "It is not a hook-up slogan factory, and it is not a verified-identity product yet. Contact details can be confirmed after you join. RealMe selfie checks are planned and are not available today — we will not pretend they are.",
    },
    {
      type: "h2",
      text: "Who it is for",
    },
    {
      type: "p",
      text: "People looking for dating, relationships, or a straightforward chance to meet. DateZA is for South Africa: cities, provinces, languages, and the mix of people who actually live here. If you are outside the country, join only if you genuinely want to meet people in South Africa.",
    },
    {
      type: "h2",
      text: "How people use DateZA",
    },
    {
      type: "p",
      text: "Most members start on their phone in the browser, finish a profile, and spend a few minutes on Discover. When something is mutual, the conversation stays in DateZA until you both choose a public place. [[How it works|/how-it-works]] covers the steps. [[Safety|/dating-safely]] covers block, report, unmatch, and meeting in person.",
    },
    {
      type: "h2",
      text: "How to join",
    },
    {
      type: "p",
      text: "[[Create your profile|/sign-up]] with email or phone. DateZA is ready in the browser — on iPhone or Android you can add it to your home screen. Jobs, if we list them, will appear on [[Careers|/careers]]; dating is the product now.",
    },
  ],
};

export const adviceHubPage: SeoPage = {
  path: "/dating-advice",
  title: "Dating Advice for South Africa | DateZA",
  description:
    "Practical dating advice for South Africa: profiles, conversations, first dates, safety, and long-distance dating between cities.",
  h1: "Dating advice that assumes you live here.",
  eyebrow: "Dating advice",
  intro:
    "Short, practical guides for dating in South Africa. No recycled “10 pickup lines” lists — just the questions people actually run into before and after they join DateZA.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "hub",
  lastModified: SEO_RELEASE_DATE,
  breadcrumbs: [
    { name: "Home", path: "/" },
    { name: "Dating advice", path: "/dating-advice" },
  ],
  related: [
    { path: "/south-african-dating", label: "South African dating" },
    { path: "/dating-safely", label: "DateZA safety" },
    { path: "/how-it-works", label: "How DateZA works" },
  ],
  blocks: [
    {
      type: "h2",
      text: "Start with the question you have",
    },
    {
      type: "p",
      text: "If you are new to apps, read [[online dating in South Africa|/dating-advice/online-dating-south-africa]]. If your profile feels flat, use [[profile tips|/dating-advice/dating-profile-tips]]. If matches go quiet, try [[how to start a conversation|/dating-advice/how-to-start-a-conversation]].",
    },
    {
      type: "p",
      text: "Planning to meet? [[First date ideas|/dating-advice/first-date-ideas-south-africa]] and [[first date safety|/dating-advice/first-date-safety]] belong together. For money, pressure, and catfish patterns, see [[online dating safety|/dating-advice/online-dating-safety]]. Dating someone in another city is covered in [[long-distance dating in South Africa|/dating-advice/long-distance-dating-south-africa]].",
    },
    {
      type: "h2",
      text: "What these guides will not do",
    },
    {
      type: "p",
      text: "They will not invent DateZA member numbers, reviews, or guarantees. They will not tell you to ignore [[block and report|/dating-safely]]. And they will not replace the product: when you are ready, [[join DateZA|/sign-up]] and meet people in your city.",
    },
  ],
};
