/* ============================================================
   Welcome Labs — Content Data (Phase 1: Hardcoded)
   ============================================================
   Designed to be Sanity CMS-ready. Each field maps to a
   Sanity document/field type.
   ============================================================ */

export interface BlockColumn {
  type: "image" | "text" | "titled-text";
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
  blocks: ContentBlockData[];
}

export interface ServicesSection {
  id: string;
  title: string;
  tags: string[];
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
    blocks: [
      {
        id: "redbull-1",
        splitLeft: 6,
        splitRight: 2,
        leftContent: {
          type: "text",
          body: PLACEHOLDER_BODY,
        },
        rightContent: {
          type: "image",
          image: { src: "/images/redbull-01.svg", alt: "Redbull campaign — party scene with Red Bull can" },
        },
      },
      {
        id: "redbull-2",
        splitLeft: 2,
        splitRight: 6,
        leftContent: {
          type: "image",
          image: { src: "/images/redbull-02.svg", alt: "Redbull campaign — youth culture event" },
        },
        rightContent: {
          type: "text",
          body: PLACEHOLDER_BODY,
        },
      },
    ],
  },
  {
    id: "uniqlo",
    title: "UNIQLO",
    tags: ["Strategy", "Strategy"],
    blocks: [
      {
        id: "uniqlo-1",
        splitLeft: 3,
        splitRight: 5,
        leftContent: {
          type: "image",
          image: { src: "/images/uniqlo-01.svg", alt: "UNIQLO campaign — ice cream scene" },
        },
        rightContent: {
          type: "text",
          body: PLACEHOLDER_BODY,
        },
      },
      {
        id: "uniqlo-2",
        splitLeft: 5,
        splitRight: 3,
        leftContent: {
          type: "text",
          body: PLACEHOLDER_BODY,
        },
        rightContent: {
          type: "image",
          image: { src: "/images/uniqlo-02.svg", alt: "UNIQLO campaign — musician outdoors" },
        },
      },
    ],
  },
  {
    id: "puma",
    title: "Puma",
    tags: ["Strategy", "Strategy"],
    blocks: [
      {
        id: "puma-1",
        splitLeft: 6,
        splitRight: 2,
        leftContent: {
          type: "text",
          body: PLACEHOLDER_BODY,
        },
        rightContent: {
          type: "image",
          image: { src: "", alt: "Puma campaign placeholder" },
        },
      },
      {
        id: "puma-2",
        splitLeft: 2,
        splitRight: 6,
        leftContent: {
          type: "image",
          image: { src: "", alt: "Puma campaign placeholder" },
        },
        rightContent: {
          type: "text",
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
  blocks: [
    {
      id: "services-design",
      splitLeft: 5,
      splitRight: 3,
      leftContent: {
        type: "titled-text",
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
   All sections (ordered)
   ============================================================ */

export const allSections: (CaseStudy | ServicesSection)[] = [
  ...caseStudies,
  servicesSection,
];
