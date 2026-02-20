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

export type ContentBlock = SplitBlock | FullImageBlock | TitleBlock | GalleryBlock;

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
        type: "title",
        id: "redbull-3",
        text: "Four decades of content. One zine that made it matter again.",
        width: "50%",
        align: "left",
      },
      {
        type: "split",
        id: "redbull-1",
        splitLeft: 6,
        splitRight: 2,
        leftContent: {
          type: "image",
          image: { src: "/images/companylogos/redbull/Redbull_Image_01.png", alt: "Redbull campaign — image 1" },
        },
        rightContent: {
          type: "text",
          align: "top",
          body: "Red Bull asked Welcome to dig through nearly four decades of archival content and identify what would resonate with today's digital audiences. \n\nFrom that curation, Welcome designed, produced, and printed a limited-edition zine, distributed at a co-produced event with Red Bull.",
        },
      },
      {
        type: "full-image",
        id: "redbull-2",
        src: "/images/companylogos/redbull/Redbull_Image_02.png",
        alt: "Redbull campaign — image 2",
      },
      
      {
        type: "split",
        id: "redbull-4",
        splitLeft: 2,
        splitRight: 6,
        rightContent: {
          type: "image",
          image: { src: "/images/companylogos/redbull/Redbull_Image_03.png", alt: "Redbull campaign — image 3" },
        },
        leftContent: {
          type: "text",
          align: "top",
          body: "The result: archival research turned into a tangible cultural object — digital curation made physical through design, editorial direction, and IRL activation.",
        },
      },
      {
        type: "full-image",
        id: "redbull-4",
        src: "/images/companylogos/redbull/Redbull_Image_04.png",
        alt: "Redbull campaign — image 4",
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
        type: "title",
        id: "uniqlo-0",
        text: "The full creative engine behind Studio Ghibli's US moment.",
        width: "50%",
        align: "left",
      },
      {
        type: "split",
        id: "uniqlo-1",
        splitLeft: 5,
        splitRight: 3,
        leftContent: {
          type: "image",
          image: { src: "/images/companylogos/uniqlo/uniqlo_01.png", alt: "UNIQLO campaign — image 1" },
        },
        rightContent: {
          type: "text",
          align: "top",
          body: "Uniqlo was launching its Studio Ghibli collaboration collection in the US and needed a partner who could make it resonate with internet-native, culture-forward audiences — not just announce a product drop.\n\nWelcome developed the full creative strategy for the US launch.",
        },
      },
      {
        type: "full-image",
        id: "uniqlo-2",
        src: "/images/companylogos/uniqlo/uniqlo_02.png",
        alt: "UNIQLO campaign — image 2",
      },
      {
        type: "split",
        id: "uniqlo-3",
        splitLeft: 4,
        splitRight: 6,
        leftContent: {
          type: "text",
          align: "top",
          body: "The team proposed approximately 30 influencers; Uniqlo selected 6–8. Welcome managed all communications, directed content creation, and wrote captions for each curated account in the distribution network.",
        },
        rightContent: {
          type: "image",
          image: { src: "/images/companylogos/uniqlo/uniqlo_03.png", alt: "UNIQLO campaign — image 3" },
        },
      },
      {
        type: "split",
        id: "uniqlo-5",
        splitLeft: 5,
        splitRight: 3,
        rightContent: {
          type: "text",
          align: "top",
          body: "For the LA activation, Welcome conceptualized a campaign to drive in-store traffic: Anyone who purchased merch at Uniqlo's Santa Monica location received a free ticket to a Studio Ghibli film screening at Brain Dead Studios.\n\nWelcome designed a custom popcorn bucket in the spirit of Studio Ghibli, coordinated Japanese-themed food and candy, built out DIY bracelet stations, and managed the full Brain Dead Studios partnership and creative production.",
        },
        leftContent: {
          type: "image",
          image: { src: "/images/companylogos/uniqlo/uniqlo_05.png", alt: "UNIQLO campaign — image 4" },
        },
      },
      {
        type: "split",
        id: "uniqlo-4",
        splitLeft: 3,
        splitRight: 5,
        rightContent: {
          type: "image",
          image: { src: "/images/companylogos/uniqlo/uniqlo_04.png", alt: "UNIQLO campaign — image 4" },
        },
        leftContent: {
          type: "text",
          align: "top",
          body: "Content was seeded across Instagram and TikTok through Welcome's curated creator network.",
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
        type: "title",
        id: "puma-0",
        text: "How Puma launched a sneaker without ever mentioning Puma.",
        width: "50%",
        align: "left",
      },
      {
        type: "split",
        id: "puma-1",
        splitLeft: 5,
        splitRight: 3,
        leftContent: {
          type: "image",
          image: { src: "/images/companylogos/puma/puma_01.png", alt: "Puma campaign — image 1" },
        },
        rightContent: {
          type: "text",
          align: "top",
          body: "Puma was launching the Mostro sneaker and needed authentic awareness in electronic music and streetwear culture — without it feeling like a product campaign.",
        },
      },
      {
        type: "full-image",
        id: "puma-2",
        src: "/images/companylogos/puma/puma_02.png",
        alt: "Puma campaign — image 2",
      },
      {
        type: "title",
        id: "puma-3",
        text: "Welcome proposed something counterintuitive: don't launch the shoe — document a world the shoe already lives in.",
        width: "70%",
        align: "left",
      },
      {
        type: "full-image",
        id: "puma-4",
        src: "/images/companylogos/puma/puma_03.png",
        alt: "Puma campaign — image 3",
      },
      {
        type: "split",
        id: "puma-5",
        splitLeft: 3,
        splitRight: 5,
        leftContent: {
          type: "text",
          align: "top",
          body: "Welcome directed a production team (Cold Archive) across Seoul, Taipei, and Shenzhen to photograph Asia's underground electronic music scene.",
        },
        rightContent: {
          type: "image",
          image: { src: "/images/companylogos/puma/puma_04.png", alt: "Puma campaign — image 4" },
        },
      },
      {
        type: "split",
        id: "puma-6",
        splitLeft: 5,
        splitRight: 3,
        leftContent: {
          type: "image",
          image: { src: "/images/companylogos/puma/puma_05.png", alt: "Puma campaign — image 5" },
        },
        rightContent: {
          type: "text",
          align: "top",
          body: "Everyone featured was wearing Mostros.\n\nPuma was never mentioned once in any caption. The content was framed as a cultural editorial: \"The Cultural Incubation of Asia's Electronic Underground.\"",
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
      type: "split",
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
      type: "split",
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
      type: "split",
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
