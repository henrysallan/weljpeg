/* ============================================================
   Welcome Labs — Content Data (Phase 1: Hardcoded)
   ============================================================
   Designed to be Sanity CMS-ready. Each field maps to a
   Sanity document/field type.
   ============================================================ */

/* ---- Module types (union) ---- */

/** Module 1: Split — body text on one side, image on the other */
export interface SplitBlock {
  type: "split";
  id: string;
  splitLeft: number;
  splitRight: number;
  leftContent: BlockColumn;
  rightContent: BlockColumn;
}

/** Module 2: Full-width image */
export interface FullImageBlock {
  type: "full-image";
  id: string;
  src: string;
  alt: string;
}

/** Module 3: Title */
export interface TitleBlock {
  type: "title";
  id: string;
  text: string;
  width?: string;           // e.g. "60%", "100%", "480px"
  align?: "left" | "center" | "right";
}

/** Module 4: Image gallery — evenly divides page width */
export interface GalleryBlock {
  type: "gallery";
  id: string;
  images: { src: string; alt: string }[];
}

/** Module 5: Cards — equal-width columns, each with a title + body, stroke border */
export interface CardsBlock {
  type: "cards";
  id: string;
  cards: { title: string; body: string }[];
}

/** Module 6: Case-study page — single viewport-height layout with text (upper-left) + image grid (bottom-right) */
export interface CaseStudyPageBlock {
  type: "case-study-page";
  id: string;
  headline: string;
  texts: string[];
  images: { src: string; alt: string }[];
}

/** Module 7: About — text paragraphs on the left, single image on the right */
export interface AboutBlock {
  type: "about";
  id: string;
  paragraphs: string[];
  image: { src: string; alt: string };
}

export type ContentBlock = SplitBlock | FullImageBlock | TitleBlock | GalleryBlock | CardsBlock | CaseStudyPageBlock | AboutBlock;

/* ---- Column types (used inside SplitBlock) ---- */

export interface BlockColumn {
  type: "image" | "text" | "titled-text";
  align?: "top" | "center" | "bottom";
  image?: {
    src: string;
    alt: string;
  };
  body?: string;
  subHeading?: string;
}

/* ---- Section types ---- */

export interface CaseStudy {
  id: string;
  title: string;
  tags: string[];
  description: string;
  client: string;
  services: string;
  blocks: ContentBlock[];
}

export interface ServicesSection {
  id: string;
  title: string;
  tags: string[];
  description: string;
  client: string;
  services: string;
  blocks: ContentBlock[];
}

/* ---- Placeholder body copy ---- */

const PLACEHOLDER_BODY =
  "Welcome is a creative lab that engineers cultural relevance through media, talent. Welcome is a creative lab that engineers cultural relevance through media, talent. Welcome is a creative lab that engineers cultural relevance through media, talent.";

const PLACEHOLDER_BODY_SHORT =
  "Welcome is a creative lab that engineers cultural relevance through media, talent. Welcome is a creative lab that engineers cultural relevance through media, talent.";

/* ============================================================
   Case Studies
   ============================================================ */

export const caseStudies: CaseStudy[] = [
  {
    id: "redbull",
    title: "Redbull",
    tags: ["Strategy", "Experiential"],
    description: "Welcome Labs partnered with Redbull to develop a comprehensive creative strategy that redefined their brand presence across key cultural touchpoints. Our team worked closely with their internal marketing division to identify emerging trends and translate them into authentic, engaging experiences that resonated with youth audiences worldwide.",
    client: "Redbull",
    services: "Strategy, Experiential",
    blocks: [
      {
        type: "case-study-page",
        id: "redbull-page",
        headline: "Four decades of content. One zine that made it matter again.",
        texts: [
          "Red Bull had decades of cultural IP sitting untouched. Archive footage from 1987 to now: music, extreme sports, art, subcultures, none of it doing anything for the brand in its current form.",
          "We [built an editorial strategy] around that archive, shaping it into a narrative that traced Red Bull's real history inside these scenes rather than just cataloguing old clips.",
          "Our team [curated and sequenced the material], then [produced a limited-run zine] that gave the best of it a physical form.",
          "We [brought the archive into a live space] with an in-person activation, documented it, and [distributed everything through our channels and creative network].",
          "Tens of millions of organic impressions followed. We are regularly working with the New York team to curate their in-person activations and bring them in as a partner on ours.",
        ],
        images: [
          { src: "/images/companylogos/redbull/Redbull_01.jpg", alt: "Redbull campaign — image 1" },
          { src: "/images/companylogos/redbull/Redbull_02.jpg", alt: "Redbull campaign — image 2" },
          { src: "/images/companylogos/redbull/Redbull_03.png", alt: "Redbull campaign — image 3" },
          { src: "/images/companylogos/redbull/Redbull_04.png", alt: "Redbull campaign — image 4" },
          { src: "/images/companylogos/redbull/Redbull_05.png", alt: "Redbull campaign — image 5" },
        ],
      },
    ],
  },
  {
    id: "uniqlo",
    title: "Uniqlo",
    tags: ["Strategy", "Strategy"],
    description: "A multi-channel campaign redefining Uniqlo's cultural footprint across digital and physical spaces. We crafted a narrative that connected everyday fashion with creative expression, leveraging talent partnerships and community activations to drive authentic engagement with a new generation of consumers.",
    client: "Uniqlo",
    services: "Strategy, Content",
    blocks: [
      {
        type: "case-study-page",
        id: "uniqlo-page",
        headline: "The full creative engine behind Studio Ghibli's US moment.",
        texts: [
          "When Uniqlo secured their Studio Ghibli collaboration, our team [sorted through our creative network] and [pitched the tastemakers] who genuinely fit the world of Ghibli.",
          "We [developed creative briefs] for each of them, [coordinated their posting], and [managed every relationship] from start to finish. All of these people were already in our network, which is why the whole thing moved fast and felt real.",
          "Then we took it offline: we [conceptualized and coordinated a movie screening] of Studio Ghibli films at Braindead Studios in Los Angeles, [designed and produced custom merch] for the event including a one-of-one popcorn bucket, and [documented the entire thing].",
          "The collection had a social push that felt organic because it was built on actual taste, and a physical experience that gave people something worth showing up for.",
        ],
        images: [
          { src: "/images/companylogos/uniqlo/Uniqlo_01.jpg", alt: "UNIQLO campaign — image 1" },
          { src: "/images/companylogos/uniqlo/Uniqlo_02.jpg", alt: "UNIQLO campaign — image 2" },
          { src: "/images/companylogos/uniqlo/Uniqlo_03.png", alt: "UNIQLO campaign — image 3" },
        ],
      },
    ],
  },
  {
    id: "puma",
    title: "Puma",
    tags: ["Strategy", "Strategy"],
    description: "Welcome Labs collaborated with Puma on a creative strategy that bridged performance sport and street culture. Through curated talent activations and experiential design, we built a campaign framework that elevated brand perception among culturally engaged audiences across key markets.",
    client: "Puma",
    services: "Strategy, Design",
    blocks: [
      {
        type: "case-study-page",
        id: "puma-page",
        headline: "How Puma launched a sneaker without ever mentioning Puma.",
        texts: [
          "We [designed a social and content strategy] for Puma that reframed their product drops as cultural moments worth paying attention to.",
          "The [creative development] was built to feel native to every platform it touched: visual systems, narratives, and formats designed for the way people actually scroll and share.",
          "We [brought collaborators in through our creative network] to shoot and style the work, then [distributed across our owned channels and partner pages] to push it past Puma's existing audience.",
          "Millions of impressions, high save rates, and comment sections full of real conversation. The work performed because it looked like something people would have shared anyway.",
          "For [Paris Fashion Week], we coordinated a collaborative event, brought out [rising rapper PZ] for a performance, and curated the guest list and supporting acts.",
        ],
        images: [
          { src: "/images/companylogos/puma/Puma_01.jpg", alt: "Puma campaign — image 1" },
          { src: "/images/companylogos/puma/Puma_02.jpg", alt: "Puma campaign — image 2" },
          { src: "/images/companylogos/puma/Puma_03.png", alt: "Puma campaign — image 3" },
          { src: "/images/companylogos/puma/Puma_04.png", alt: "Puma campaign — image 4" },
          { src: "/images/companylogos/puma/Puma_05.png", alt: "Puma campaign — image 5" },
          { src: "/images/companylogos/puma/Puma_06.png", alt: "Puma campaign — image 6" },
        ],
      },
    ],
  },
];

/* ============================================================
   Services
   ============================================================ */

export const servicesSection: ServicesSection = {
  id: "services",
  title: "SERVICES",
  tags: ["Strategy", "Strategy"],
  description: "Welcome Labs offers end-to-end creative services that engineer cultural relevance for forward-thinking brands. From strategic planning through execution and distribution, we provide the tools and talent necessary to introduce new ideas to the culture at scale.",
  client: "Welcome Labs",
  services: "Design, Development, Distribution",
  blocks: [
    {
      type: "cards",
      id: "services-cards",
      cards: [
        {
          title: "Design",
          body: PLACEHOLDER_BODY_SHORT,
        },
        {
          title: "Develop",
          body: PLACEHOLDER_BODY_SHORT,
        },
        {
          title: "Distribute",
          body: PLACEHOLDER_BODY_SHORT,
        },
      ],
    },
  ],
};

/* ============================================================
   Insight
   ============================================================ */

export const insightSection: ServicesSection = {
  id: "insight",
  title: "INSIGHT",
  tags: ["Culture", "Trends"],
  description: "A window into the cultural currents shaping tomorrow.",
  client: "Welcome Labs",
  services: "Research, Analysis",
  blocks: [
    {
      type: "about",
      id: "insight-about",
      paragraphs: [
        "Welcome is a creative agency that helps growth-stage technology companies that need to turn ambitious products into cultural conversation.",
        "We operate at the intersection of taste and virality; we create work that\u2019s culturally elevated and built to scale.",
        "What makes us different is simple: we built our agency on the back of a media brand we run ourselves. A publication with over 1.5 million followers that gives us real-time cultural intelligence, a creative network rooted in authentic relationships, and distribution infrastructure most agencies have to rent.",
        "We design strategies, develop content, and distribute through the channels and communities where quality attention really forms.",
        "For companies that need more than a campaign and more than a vendor, Welcome is the growth engine.",
      ],
      image: { src: "", alt: "Welcome Labs — placeholder" },
    },
  ],
};

/* ============================================================
   All sections (ordered)
   ============================================================ */

export const allSections: (CaseStudy | ServicesSection)[] = [
  ...caseStudies,
  servicesSection,
  insightSection,
];
