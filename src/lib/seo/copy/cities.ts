import { SEO_RELEASE_DATE } from "../site.ts";
import type { SeoPage } from "../types.ts";

const datingCrumb = { name: "Dating", path: "/dating" } as const;

export const CITY_CARDS = [
  {
    slug: "cape-town",
    name: "Cape Town",
    province: "Western Cape",
    path: "/dating/cape-town",
    image: "/images/places/cape-town.webp",
    blurb: "Mountain-to-sea dates, long summers, and a scene that mixes locals with people who just arrived.",
  },
  {
    slug: "johannesburg",
    name: "Johannesburg",
    province: "Gauteng",
    path: "/dating/johannesburg",
    image: "/images/places/johannesburg.webp",
    blurb: "A wide dating pool across Joburg’s suburbs — if you can agree on whose side of the highway.",
  },
  {
    slug: "pretoria",
    name: "Pretoria",
    province: "Gauteng",
    path: "/dating/pretoria",
    image: "/images/places/pretoria.webp",
    blurb: "Jacaranda streets, government hours, and plenty of people who also date in Joburg.",
  },
  {
    slug: "durban",
    name: "Durban",
    province: "KwaZulu-Natal",
    path: "/dating/durban",
    image: "/images/places/durban.webp",
    blurb: "Beach-first weekends, Florida Road nights, and a warmer pace than the inland metros.",
  },
  {
    slug: "gqeberha",
    name: "Gqeberha",
    province: "Eastern Cape",
    path: "/dating/gqeberha",
    image: "/images/places/gqeberha.webp",
    blurb: "Algoa Bay, a smaller circle, and dates that still feel like a medium-sized city.",
  },
  {
    slug: "bloemfontein",
    name: "Bloemfontein",
    province: "Free State",
    path: "/dating/bloemfontein",
    image: "/images/places/bloemfontein.webp",
    blurb: "A tighter dating pool where overlapping friends are normal — honesty travels faster.",
  },
] as const;

export const capeTownPage: SeoPage = {
  path: "/dating/cape-town",
  title: "Dating in Cape Town | DateZA",
  description:
    "Dating in Cape Town on DateZA. Meet Cape Town singles, plan dates from Sea Point to the City Bowl, and keep safety in reach.",
  h1: "Dating in Cape Town",
  eyebrow: "Western Cape",
  intro:
    "Cape Town dating is mountain, sea, wind, and traffic — plus a mix of people who grew up here and people who landed last month. DateZA is how you meet Cape Town singles without treating the city like a holiday brochure.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "city",
  lastModified: SEO_RELEASE_DATE,
  image: { src: "/images/places/cape-town.webp", alt: "Cape Town and Table Mountain from the city" },
  breadcrumbs: [
    { name: "Home", path: "/" },
    datingCrumb,
    { name: "Cape Town", path: "/dating/cape-town" },
  ],
  related: [
    { path: "/dating/johannesburg", label: "Dating in Johannesburg" },
    { path: "/dating/durban", label: "Dating in Durban" },
    { path: "/dating-advice/first-date-ideas-south-africa", label: "First date ideas in South Africa" },
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/sign-up", label: "Meet Cape Town singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is in this city",
    },
    {
      type: "p",
      text: "DateZA is the same South African dating app everywhere: profile, Discover, like, match, chat. In Cape Town you set your city so you see people who actually date here — City Bowl, Atlantic Seaboard, Southern Suburbs, Northern Suburbs, the Flats, or the Winelands edge — not a pile of profiles from another province.",
    },
    {
      type: "h2",
      text: "Who this page is for",
    },
    {
      type: "p",
      text: "Locals who are tired of tourist-season noise. Students and young professionals in Observatory, Woodstock, Gardens, or Stellenbosch who still come into town. People who moved for work and do not have a ready-made circle. Visitors should only join if they will be here long enough to meet in person.",
    },
    {
      type: "h2",
      text: "How dating actually feels in Cape Town",
    },
    {
      type: "p",
      text: "Distances look short on a map and get long in wind or load shedding. A drink in Sea Point is a different night from coffee in Claremont. The promenade is public and easy to leave; Camps Bay at sunset is beautiful and often packed with people who are not looking for a second date. Say what side of the mountain you live on. It saves half the chat.",
    },
    {
      type: "p",
      text: "Cape Town also mixes languages and scenes in a small geographic bowl. You will meet people who hike before work, people who only come out after the south-easter drops, and people who would rather do a weekday lunch in the Gardens than a Saturday club. None of that is a personality test — it is just the city.",
    },
    {
      type: "h2",
      text: "Useful local context",
    },
    {
      type: "ul",
      items: [
        "Public first-date defaults: Sea Point promenade, Company’s Garden, Kloof Street coffee, a gallery in Woodstock.",
        "Winelands day dates are a second-date idea, not a first — you need your own transport.",
        "If someone will only meet at their Airbnb, that is a no.",
        "Parking and safety vary block by block. Choose places you already know how to leave.",
      ],
    },
    {
      type: "h2",
      text: "How DateZA works here",
    },
    {
      type: "p",
      text: "[[Join free|/sign-up]], add photos that look like you on a Cape Town Saturday, and set Cape Town as your city. Discover gives you a daily set; Find is there when you want to keep going. [[How it works|/how-it-works]] is the full loop. For openers that are not “Heyyy”, read [[how to start a conversation|/dating-advice/how-to-start-a-conversation]].",
    },
    {
      type: "h2",
      text: "Safety and trust",
    },
    {
      type: "p",
      text: "Chat on DateZA first. Meet in public. Arrange your own way home. DateZA gives you [[block, report and unmatch|/dating-safely]]; contact can be verified after you join. We do not offer identity-document checks yet. If a chat turns to money, investment, or “I’m stuck at the Waterfront, please send airtime”, stop and report.",
    },
  ],
};

export const johannesburgPage: SeoPage = {
  path: "/dating/johannesburg",
  title: "Dating in Johannesburg | DateZA",
  description:
    "Dating in Johannesburg on DateZA. Meet Joburg singles across Sandton, Rosebank, Melville, Soweto and the wider metro.",
  h1: "Dating in Johannesburg",
  eyebrow: "Gauteng",
  intro:
    "Johannesburg dating is a metro problem: many people, many suburbs, and a real argument about who is driving. DateZA is for Joburg singles who want a date, not another group chat.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "city",
  lastModified: SEO_RELEASE_DATE,
  image: { src: "/images/places/johannesburg.webp", alt: "Johannesburg city skyline" },
  breadcrumbs: [
    { name: "Home", path: "/" },
    datingCrumb,
    { name: "Johannesburg", path: "/dating/johannesburg" },
  ],
  related: [
    { path: "/dating/pretoria", label: "Dating in Pretoria" },
    { path: "/dating/cape-town", label: "Dating in Cape Town" },
    { path: "/dating-advice/first-date-ideas-south-africa", label: "First date ideas" },
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/sign-up", label: "Meet Johannesburg singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is in Joburg",
    },
    {
      type: "p",
      text: "Same DateZA loop as the rest of the country — [[profile, discover, match, chat|/how-it-works]] — with Johannesburg as the city you date in. That might mean Sandton, Rosebank, Braamfontein, Melville, Greenside, Midrand, Soweto, or the East Rand. Put a suburb on your profile. In this city, “Johannesburg” alone is not enough.",
    },
    {
      type: "h2",
      text: "Who this page is for",
    },
    {
      type: "p",
      text: "People who work long Gauteng days and still want to meet someone. People who grew up in Soweto and date in Rosebank, or the other way around. Pretoria commuters who spend weeknights this side of the N1 should also read [[dating in Pretoria|/dating/pretoria]] and be honest about where they will actually show up.",
    },
    {
      type: "h2",
      text: "How dating actually feels in Johannesburg",
    },
    {
      type: "p",
      text: "The pool is large. The friction is logistics. A 12 km pin can be 50 minutes. First dates that work here are short, public, and close to a mall, a park, or a street you already trust: 44 Stanley, Parkhurst’s 4th Avenue, a Rosebank coffee, Zoo Lake in daylight. Night drives to an unknown house are not a personality quirk — they are a risk.",
    },
    {
      type: "p",
      text: "Joburg scenes split hard: corporate after-work, creative Braam nights, church-Sunday families, amapiano weekends. You do not need to pick a tribe on DateZA. You do need to say what a good Friday looks like for you, so you are not surprised when someone wants dinner at 18:00 and someone else is still in Sandton at 21:00.",
    },
    {
      type: "h2",
      text: "Useful local context",
    },
    {
      type: "ul",
      items: [
        "Agree the suburb before you agree the time.",
        "Mall coffee is unromantic and easy to leave. That is a feature on a first date.",
        "If they will only WhatsApp and never stay on DateZA, slow down.",
        "Car culture is real. Do not get into a stranger’s car because the Uber is “taking too long”.",
      ],
    },
    {
      type: "h2",
      text: "How DateZA works here",
    },
    {
      type: "p",
      text: "[[Create your profile|/sign-up]], set Johannesburg, and start with Discover. Use Find when you know you want another look. When you match, suggest one concrete place — not “we’ll see”. [[First date ideas|/dating-advice/first-date-ideas-south-africa]] includes Joburg-friendly options that are not a three-hour dinner.",
    },
    {
      type: "h2",
      text: "Safety and trust",
    },
    {
      type: "p",
      text: "Joburg dating scams often sound like a business emergency or a too-fast move off the app. DateZA keeps [[block and report|/dating-safely]] on profiles and chats. Unmatch is separate from block. Tell someone where you are going. Meet in public. DateZA confirms email or phone after you join; it does not confirm a national ID.",
    },
  ],
};

export const pretoriaPage: SeoPage = {
  path: "/dating/pretoria",
  title: "Dating in Pretoria | DateZA",
  description:
    "Dating in Pretoria (Tshwane) on DateZA. Meet Pretoria singles in Hatfield, Brooklyn, Menlyn and across the Jacaranda City.",
  h1: "Dating in Pretoria",
  eyebrow: "Gauteng · Tshwane",
  intro:
    "Pretoria dating is quieter than Joburg’s, closer than it looks on a Saturday, and full of people who split their week between Tshwane and the south. DateZA is for Pretoria singles who want that said out loud.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "city",
  lastModified: SEO_RELEASE_DATE,
  image: { src: "/images/places/pretoria.webp", alt: "Jacaranda-lined street in Pretoria" },
  breadcrumbs: [
    { name: "Home", path: "/" },
    datingCrumb,
    { name: "Pretoria", path: "/dating/pretoria" },
  ],
  related: [
    { path: "/dating/johannesburg", label: "Dating in Johannesburg" },
    { path: "/dating/bloemfontein", label: "Dating in Bloemfontein" },
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/sign-up", label: "Meet Pretoria singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is in Pretoria",
    },
    {
      type: "p",
      text: "DateZA is how you meet people who date in Tshwane — Hatfield, Brooklyn, Menlyn, Centurion, the west, or the older east. You still get the national product: [[Discover, like, match, chat|/how-it-works]]. You do not get a second, Pretoria-only app.",
    },
    {
      type: "h2",
      text: "Who this page is for",
    },
    {
      type: "p",
      text: "Students around Hatfield and the University of Pretoria. Public-service and diplomatic households with weekday routines. People in Centurion who are tired of being treated as “almost Joburg”. If you mainly date in Sandton, say Johannesburg on your profile and visit [[dating in Johannesburg|/dating/johannesburg]].",
    },
    {
      type: "h2",
      text: "How dating actually feels in Pretoria",
    },
    {
      type: "p",
      text: "The city has a reputation for being early, churchy, or quiet. Some of that is fair on a Sunday. It is also a city of long jacaranda streets, decent coffee in Brooklyn, and people who will drive to Joburg for a concert and still want to be home before the last N1 snarl. First dates that work: Menlyn Maine in daylight, a Brooklyn coffee, a walk at the Union Buildings gardens, Lochner or similar — public, timed, easy to end.",
    },
    {
      type: "p",
      text: "Because Pretoria and Johannesburg share a labour market, mixed-city matches are common. Decide early whether you are willing to meet halfway in Midrand or whether you only date this side. Ambiguity here wastes weeks.",
    },
    {
      type: "h2",
      text: "Useful local context",
    },
    {
      type: "ul",
      items: [
        "Hatfield energy and Brooklyn dinners are not the same night. Say which you mean.",
        "Centurion mall dates are practical. Pretoria CBD after dark is a different calculation — pick places you know.",
        "If they live “just in Joburg”, ask which suburb before you commit to a drive.",
        "Spring jacarandas are pretty. They are not a personality.",
      ],
    },
    {
      type: "h2",
      text: "How DateZA works here",
    },
    {
      type: "p",
      text: "[[Join DateZA|/sign-up]], set Pretoria, and keep your photos current. When you match, offer one Pretoria place and one backup time. For intercity chat that is not a stall, see [[long-distance dating in South Africa|/dating-advice/long-distance-dating-south-africa]].",
    },
    {
      type: "h2",
      text: "Safety and trust",
    },
    {
      type: "p",
      text: "Use [[block and report|/dating-safely]] if someone pushes you off the app, asks for money, or will not meet in public. DateZA can verify a contact method. It does not verify a government ID. Tell a friend which campus or mall you are going to.",
    },
  ],
};

export const durbanPage: SeoPage = {
  path: "/dating/durban",
  title: "Dating in Durban | DateZA",
  description:
    "Dating in Durban on DateZA. Meet Durban singles along the Golden Mile, Florida Road, Umhlanga and inland KwaZulu-Natal.",
  h1: "Dating in Durban",
  eyebrow: "KwaZulu-Natal · eThekwini",
  intro:
    "Durban dating has humidity, Indian Ocean light, and weekends that start earlier than Gauteng thinks is decent. DateZA is for Durban singles who want a beach walk or a Florida Road table — not a generic “coastal lifestyle” pitch.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "city",
  lastModified: SEO_RELEASE_DATE,
  image: { src: "/images/places/durban.webp", alt: "Durban beachfront along the Indian Ocean" },
  breadcrumbs: [
    { name: "Home", path: "/" },
    datingCrumb,
    { name: "Durban", path: "/dating/durban" },
  ],
  related: [
    { path: "/dating/gqeberha", label: "Dating in Gqeberha" },
    { path: "/dating/cape-town", label: "Dating in Cape Town" },
    { path: "/dating-advice/first-date-ideas-south-africa", label: "First date ideas" },
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/sign-up", label: "Meet Durban singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is in Durban",
    },
    {
      type: "p",
      text: "DateZA is the South African dating app with your city set to Durban / eThekwini. You will see people along the beachfront, Berea, Morningside, Umhlanga, Ballito-adjacent, or inland — depending on what they set. The product is still [[discover, like, match, chat|/how-it-works]].",
    },
    {
      type: "h2",
      text: "Who this page is for",
    },
    {
      type: "p",
      text: "People who live here year-round, not only December. Students and graduates who stayed. Families of the city who want something quieter than a club, and people who want the opposite on Florida Road. If you are in Pietermaritzburg or the North Coast and only come through on weekends, say that on your profile.",
    },
    {
      type: "h2",
      text: "How dating actually feels in Durban",
    },
    {
      type: "p",
      text: "The weather does half the work. A first date can be uShaka in the afternoon, a Golden Mile walk while it is still light, or coffee in Musgrave. Curry is part of the city’s food life — mention it if you care, do not perform it as a personality. Humidity and late thunderstorms are a real reason to keep the first meet short and indoor-backup-ready.",
    },
    {
      type: "p",
      text: "Durban’s dating pool is smaller than Joburg’s and less tourist-churned than peak Cape Town. That can be a relief: people overlap. It also means you should be decent, because stories travel. If you want a scene that feels more like a big inland metro, you may already be looking at [[Johannesburg|/dating/johannesburg]] for work trips — say so rather than disappearing.",
    },
    {
      type: "h2",
      text: "Useful local context",
    },
    {
      type: "ul",
      items: [
        "Beachfront is public. After dark, pick stretches and parking you already trust.",
        "Umhlanga and the Berea are not interchangeable — the drive is the date if you get it wrong.",
        "A walk plus one drink beats a three-hour dinner when you have just matched.",
        "If they refuse a public place “because Durban is small”, that is not a safety plan.",
      ],
    },
    {
      type: "h2",
      text: "How DateZA works here",
    },
    {
      type: "p",
      text: "[[Join free|/sign-up]], set Durban, and keep photos recent — beach light is unforgiving in both directions. When you match, offer a daylight public option. [[First date safety|/dating-advice/first-date-safety]] applies on the promenade the same way it does inland.",
    },
    {
      type: "h2",
      text: "Safety and trust",
    },
    {
      type: "p",
      text: "Keep chats on DateZA until you have a place and a time. [[Block and report|/dating-safely]] stay free. Watch for romance-scam patterns that mention ships, mines, or sudden hospital bills. DateZA verifies contact, not a passport.",
    },
  ],
};

export const gqeberhaPage: SeoPage = {
  path: "/dating/gqeberha",
  title: "Dating in Gqeberha | DateZA",
  description:
    "Dating in Gqeberha (Port Elizabeth) on DateZA. Meet PE singles around Algoa Bay, Summerstrand, Richmond Hill and the Eastern Cape.",
  h1: "Dating in Gqeberha",
  eyebrow: "Eastern Cape",
  intro:
    "Gqeberha — still PE in a lot of conversations — is a bay city with a dating pool you can actually finish a sentence in. DateZA is for people here who want a match that can become a walk on Hobie Beach, not a profile that lives in another province.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "city",
  lastModified: SEO_RELEASE_DATE,
  image: { src: "/images/places/gqeberha.webp", alt: "Algoa Bay coastline in Gqeberha" },
  breadcrumbs: [
    { name: "Home", path: "/" },
    datingCrumb,
    { name: "Gqeberha", path: "/dating/gqeberha" },
  ],
  related: [
    { path: "/dating/durban", label: "Dating in Durban" },
    { path: "/dating/cape-town", label: "Dating in Cape Town" },
    { path: "/dating-advice/online-dating-south-africa", label: "Online dating in South Africa" },
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/sign-up", label: "Meet Gqeberha singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is in Gqeberha",
    },
    {
      type: "p",
      text: "DateZA is the national dating app with your city set to Gqeberha. The name on street signs changed; a lot of people still say Port Elizabeth or PE. On your profile, use the name you actually use in chat so the first message is not a debate. The product remains [[join, discover, match, meet|/how-it-works]].",
    },
    {
      type: "h2",
      text: "Who this page is for",
    },
    {
      type: "p",
      text: "People in Summerstrand, Richmond Hill, Walmer, Newton Park, Motherwell, and the wider Nelson Mandela Bay. Students and graduates who stayed when friends left for Cape Town or Joburg. People in Makhanda or Jeffreys Bay who come through and are willing to say when they are actually in town.",
    },
    {
      type: "h2",
      text: "How dating actually feels here",
    },
    {
      type: "p",
      text: "The pool is smaller than the big three metros. That is the point for some people: fewer endless swipes, more chance you have a friend in common. It also means you should behave, and you should not treat the city as a last resort. First dates that fit: Hobie Beach while it is light, Richmond Hill coffee, a Boardwalk walk that you can leave, a museum hour if the wind is vile.",
    },
    {
      type: "p",
      text: "Eastern Cape distances are honest. Addo is a day trip, not a first date. If someone is “in PE this weekend” from East London or beyond, ask which days before you clear Saturday. Wind is a personality in this city — have an indoor backup.",
    },
    {
      type: "h2",
      text: "Useful local context",
    },
    {
      type: "ul",
      items: [
        "Say Gqeberha or PE the way you speak. Do not correct a match as an opener.",
        "Smaller pool ≠ lower standards. It means clearer communication.",
        "Beach parking and after-dark beachfronts need the same caution as any SA city.",
        "If you are only here for a work week, put dates on the profile. Do not vanish on Sunday.",
      ],
    },
    {
      type: "h2",
      text: "How DateZA works here",
    },
    {
      type: "p",
      text: "[[Create your profile|/sign-up]], set Gqeberha, and write one true thing about how you spend a weekend here. When the city feels quiet, that is a reason to send a decent opener — see [[how to start a conversation|/dating-advice/how-to-start-a-conversation]] — not a reason to spam.",
    },
    {
      type: "h2",
      text: "Safety and trust",
    },
    {
      type: "p",
      text: "Overlapping circles are common. Still meet in public. Still use [[block and report|/dating-safely]]. DateZA will not announce that you reported someone. Contact verification exists; identity-document verification does not, yet.",
    },
  ],
};

export const bloemfonteinPage: SeoPage = {
  path: "/dating/bloemfontein",
  title: "Dating in Bloemfontein | DateZA",
  description:
    "Dating in Bloemfontein on DateZA. Meet Mangaung singles around Westdene, the UFS area and the Free State capital.",
  h1: "Dating in Bloemfontein",
  eyebrow: "Free State · Mangaung",
  intro:
    "Bloemfontein dating is a capital-city circle: students, courts, and people who already share a braai somewhere. DateZA is for Mangaung singles who want a match without pretending this is Johannesburg.",
  robots: "index, follow",
  sitemap: true,
  schemaTypes: ["WebPage", "BreadcrumbList"],
  kind: "city",
  lastModified: SEO_RELEASE_DATE,
  image: { src: "/images/places/bloemfontein.webp", alt: "Bloemfontein city and open Free State sky" },
  breadcrumbs: [
    { name: "Home", path: "/" },
    datingCrumb,
    { name: "Bloemfontein", path: "/dating/bloemfontein" },
  ],
  related: [
    { path: "/dating/pretoria", label: "Dating in Pretoria" },
    { path: "/dating/johannesburg", label: "Dating in Johannesburg" },
    { path: "/dating-advice/long-distance-dating-south-africa", label: "Long-distance dating in South Africa" },
    { path: "/dating-safely", label: "Dating safely" },
    { path: "/sign-up", label: "Meet Bloemfontein singles" },
  ],
  blocks: [
    {
      type: "h2",
      text: "What DateZA is in Bloemfontein",
    },
    {
      type: "p",
      text: "DateZA is how you meet people who date in Bloemfontein / Mangaung. The app is the same as everywhere else — [[profile, Discover, match, chat|/how-it-works]] — with a city setting that keeps you in this pool, not a random national feed.",
    },
    {
      type: "h2",
      text: "Who this page is for",
    },
    {
      type: "p",
      text: "University of the Free State students and the people who stayed after. People who work around the courts, hospitals, and government offices. Anyone in Westdene, Universitas, Dan Pienaar, or the wider Mangaung area who is tired of the same three venues and the same three introductions.",
    },
    {
      type: "h2",
      text: "How dating actually feels here",
    },
    {
      type: "p",
      text: "The pool is smaller. Friends-of-friends is normal. That can feel safe; it can also feel exposed. Be kind in chats you will not continue. First dates that fit the city: Loch Logan in the day, a coffee you can walk away from, Naval Hill while there is light and you have your own car, a simple dinner that is not a performance.",
    },
    {
      type: "p",
      text: "Winters are sharp and summers are thunderstorm country. Plan indoor backups. If you are dating someone who works in Pretoria or Joburg during the week, you are already in [[long-distance territory|/dating-advice/long-distance-dating-south-africa]] — agree the calendar early so Bloemfontein is not a perpetual “maybe this Friday”.",
    },
    {
      type: "h2",
      text: "Useful local context",
    },
    {
      type: "ul",
      items: [
        "Assume someone you pass at Mimosa or on campus might know your match.",
        "Naval Hill is a view, not a secluded first-date plan after dark.",
        "If they only want to meet “out of town”, ask why the city is not public enough.",
        "Student-year energy and professional-year energy should be said, not guessed.",
      ],
    },
    {
      type: "h2",
      text: "How DateZA works here",
    },
    {
      type: "p",
      text: "[[Join DateZA|/sign-up]], set Bloemfontein, and write like a person who might see this match at Checkers. When the local grid feels quiet, that is not a cue to invent a second account — it is a cue to finish your [[profile|/dating-advice/dating-profile-tips]] and send one clear message.",
    },
    {
      type: "h2",
      text: "Safety and trust",
    },
    {
      type: "p",
      text: "Small city is not a substitute for [[block, report and public meetings|/dating-safely]]. Unmatch if the chat is over; block if you need them out of your Discover. DateZA confirms email or phone. It does not confirm that a profile is your neighbour’s cousin — you still use your judgement.",
    },
  ],
};

export const cityPages: SeoPage[] = [
  capeTownPage,
  johannesburgPage,
  pretoriaPage,
  durbanPage,
  gqeberhaPage,
  bloemfonteinPage,
];
