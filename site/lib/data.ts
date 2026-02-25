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

export type ContentBlock = SplitBlock | FullImageBlock | TitleBlock | GalleryBlock | CardsBlock | CaseStudyPageBlock;

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
          "Red Bull asked Welcome to dig through nearly four decades of archival content and identify what would resonate with today's digital audiences.",
          "From that curation, Welcome designed, produced, and printed a limited-edition zine, distributed at a co-produced event with Red Bull.",
          "The result: archival research turned into a tangible cultural object — digital curation made physical through design, editorial direction, and IRL activation.",
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
          "Uniqlo was launching its Studio Ghibli collaboration collection in the US and needed a partner who could make it resonate with internet-native, culture-forward audiences — not just announce a product drop.",
          "Welcome developed the full creative strategy for the US launch. The team proposed approximately 30 influencers; Uniqlo selected 6–8. Welcome managed all communications, directed content creation, and wrote captions for each curated account.",
          "For the LA activation, Welcome conceptualized a campaign to drive in-store traffic: Anyone who purchased merch at Uniqlo's Santa Monica location received a free ticket to a Studio Ghibli film screening at Brain Dead Studios.",
          "Content was seeded across Instagram and TikTok through Welcome's curated creator network.",
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
          "Puma was launching the Mostro sneaker and needed authentic awareness in electronic music and streetwear culture — without it feeling like a product campaign.",
          "Welcome proposed something counterintuitive: don't launch the shoe — document a world the shoe already lives in.",
          "Welcome directed a production team (Cold Archive) across Seoul, Taipei, and Shenzhen to photograph Asia's underground electronic music scene. Everyone featured was wearing Mostros.",
          "Puma was never mentioned once in any caption. The content was framed as a cultural editorial: \"The Cultural Incubation of Asia's Electronic Underground.\"",
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
  description: "A window into the cultural currents shaping tomorrow. Welcome Labs distils emerging signals across music, fashion, sport and technology into actionable creative intelligence for forward-thinking brands.",
  client: "Welcome Labs",
  services: "Research, Analysis",
  blocks: [
    {
      type: "split",
      id: "insight-1",
      splitLeft: 5,
      splitRight: 3,
      leftContent: {
        type: "titled-text",
        align: "top",
        subHeading: "Cultural Intelligence",
        body: "We map the movements, communities and moments that define relevance — translating cultural data into strategic opportunity for brands seeking authentic connection with their audiences.",
      },
      rightContent: {
        type: "image",
        image: { src: "", alt: "Insight — cultural intelligence placeholder" },
      },
    },
    {
      type: "split",
      id: "insight-2",
      splitLeft: 3,
      splitRight: 5,
      leftContent: {
        type: "image",
        image: { src: "", alt: "Insight — trend forecasting placeholder" },
      },
      rightContent: {
        type: "titled-text",
        align: "top",
        subHeading: "Trend Forecasting",
        body: "Our proprietary research methodology identifies emerging patterns before they reach the mainstream — giving our partners first-mover advantage in an attention-scarce landscape.",
      },
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
