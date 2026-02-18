/* ============================================================
   Welcome Labs — Content Data (Phase 1: Hardcoded)
   ============================================================
   Designed to be Sanity CMS-ready. Each field maps to a
   Sanity document/field type.
   ============================================================ */

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

export interface ContentBlockData {
  id: string;
  splitLeft: number;
  splitRight: number;
  leftContent: BlockColumn;
  rightContent: BlockColumn;
}

export interface CaseStudy {
  id: string;
  title: string;
  tags: string[];
  description: string;
  client: string;
  services: string;
  blocks: ContentBlockData[];
}

export interface ServicesSection {
  id: string;
  title: string;
  tags: string[];
  description: string;
  client: string;
  services: string;
  blocks: ContentBlockData[];
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
        id: "redbull-1",
        splitLeft: 3,
        splitRight: 5,
        leftContent: {
          type: "text",
          align: "top",
          body: PLACEHOLDER_BODY,
        },
        rightContent: {
          type: "image",
          image: { src: "/images/redbull_1.png", alt: "Redbull campaign — party scene with Red Bull can" },
        },
      },
      {
        id: "redbull-2",
        splitLeft: 8,
        splitRight: 6,
        leftContent: {
          type: "image",
          image: { src: "/images/redbull_2.png", alt: "Redbull campaign — youth culture event" },
        },
        rightContent: {
          type: "text",
          align: "top",
          body: PLACEHOLDER_BODY,
        },
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
        id: "uniqlo-1",
        splitLeft: 5,
        splitRight: 3,
        leftContent: {
          type: "image",
          image: { src: "/images/uniqlo_2.png", alt: "UNIQLO campaign — ice cream scene" },
        },
        rightContent: {
          type: "text",
          align: "top",
          body: PLACEHOLDER_BODY,
        },
      },
      {
        id: "uniqlo-2",
        splitLeft: 4,
        splitRight: 4,
        leftContent: {
          type: "text",
          align: "top",
          body: PLACEHOLDER_BODY,
        },
        rightContent: {
          type: "image",
          image: { src: "/images/uniqlo_3.png", alt: "UNIQLO campaign — musician outdoors" },
        },
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
        id: "puma-1",
        splitLeft: 2,
        splitRight: 6,
        leftContent: {
          type: "text",
          align: "bottom",
          body: PLACEHOLDER_BODY,
        },
        rightContent: {
          type: "image",
          image: { src: "", alt: "Puma campaign placeholder" },
        },
      },
      {
        id: "puma-2",
        splitLeft: 6,
        splitRight: 2,
        leftContent: {
          type: "image",
          image: { src: "", alt: "Puma campaign placeholder" },
        },
        rightContent: {
          type: "text",
          align: "bottom",
          body: PLACEHOLDER_BODY,
        },
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
      id: "services-design",
      splitLeft: 5,
      splitRight: 3,
      leftContent: {
        type: "titled-text",
        align: "top",
        subHeading: "Design",
        body: PLACEHOLDER_BODY_SHORT,
      },
      rightContent: {
        type: "image",
        image: { src: "", alt: "Design services placeholder" },
      },
    },
    {
      id: "services-develop",
      splitLeft: 3,
      splitRight: 5,
      leftContent: {
        type: "image",
        image: { src: "", alt: "Develop services placeholder" },
      },
      rightContent: {
        type: "titled-text",
        align: "top",
        subHeading: "Develop",
        body: PLACEHOLDER_BODY_SHORT,
      },
    },
    {
      id: "services-distribute",
      splitLeft: 5,
      splitRight: 3,
      leftContent: {
        type: "titled-text",
        align: "top",
        subHeading: "Distribute",
        body: PLACEHOLDER_BODY_SHORT,
      },
      rightContent: {
        type: "image",
        image: { src: "", alt: "Distribute services placeholder" },
      },
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
