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
  cards: { title: string; body: string; items?: string[] }[];
}

/** A single media item — either a static image or a Vimeo video. */
export interface MediaItem {
  src: string;
  alt: string;
  /** If set, this slot renders a Vimeo player instead of an image.
   *  The `src` field is still used as the poster/thumbnail. */
  vimeoId?: string;
}

/** Module 6: Case-study page — single viewport-height layout with text (upper-left) + image grid (bottom-right) */
export interface CaseStudyPageBlock {
  type: "case-study-page";
  id: string;
  headline: string;
  texts: string[];
  images: MediaItem[];
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
  title?: string;
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
          { src: "/images/companylogos/redbull/Redbull_03.jpg", alt: "Redbull campaign — image 3" },
          { src: "/images/companylogos/redbull/Redbull_04.jpg", alt: "Redbull campaign — image 4" },
          { src: "/images/companylogos/redbull/Redbull_05.jpg", alt: "Redbull campaign — image 5" },
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
          { src: "/images/companylogos/uniqlo/Uniqlo_03.jpg", alt: "UNIQLO campaign — image 3" },
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
          { src: "/images/companylogos/puma/Puma_03.jpg", alt: "Puma campaign — image 3" },
          { src: "/images/companylogos/puma/Puma_04.jpg", alt: "Puma campaign — image 4" },
          { src: "/images/companylogos/puma/Puma_05.jpg", alt: "Puma campaign — image 5" },
          { src: "/images/companylogos/puma/Puma_06.jpg", alt: "Puma campaign — image 6" },
        ],
      },
    ],
  },
  {
    id: "rainmaker",
    title: "Rainmaker",
    tags: ["Strategy", "Content"],
    description: "A founder-forward creative and marketing strategy.",
    client: "Rainmaker",
    services: "Strategy, Content, Distribution",
    blocks: [
      {
        type: "case-study-page",
        id: "rainmaker-page",
        headline: "A founder-forward creative and marketing strategy.",
        texts: [
          "Rainmaker's founder had ideas worth hearing, but no system for getting them in front of people.",
          "We [developed a founder-forward creative strategy] built around clipping his best thinking and [seeding it across the internet] in a way that felt native to every platform it landed on.",
          "We [wrote the creative briefs], [developed ad concepts], and [managed the distribution] that turned those clips into traction for the brand.",
          "We got millions of views, through sharp content and placement. The whole approach was designed to put his personality and perspective at the front of the brand, which is the kind of thing that compounds over time rather than fading out after a campaign window closes.",
        ],
        images: [
          { src: "/images/companylogos/rainmaker/rainmaker01.png", alt: "Rainmaker campaign — image 1" },
          { src: "/images/companylogos/rainmaker/rainmaker02.png", alt: "Rainmaker campaign — image 2" },
        ],
      },
    ],
  },
  {
    id: "kidcudi",
    title: "Kid Cudi",
    tags: ["Strategy", "Content"],
    description: "Show, don't tell.",
    client: "Kid Cudi",
    services: "Strategy, Content",
    blocks: [
      {
        type: "case-study-page",
        id: "kidcudi-page",
        headline: "Show, don\u2019t tell.",
        texts: [
          "Kid Cudi\u2019s team came to us with polished press images, and we urged them to reconsider their approach.",
          "We put together a new creative strategy that placed raw images in front of our audience and the creative community.",
          "What followed was a huge viral moment \u2014 press, pages, and intrigued fans picked up our post organically; the stunt saw massive engagement and tens of millions of impressions.",
        ],
        images: [
          { src: "/images/companylogos/kidcudi/cudi01.jpeg", alt: "Kid Cudi campaign \u2014 image 1" },
        ],
      },
    ],
  },
  {
    id: "vans",
    title: "Vans",
    tags: ["Strategy", "Content"],
    description: "Integrated partnership including strategy, campaign, creation, and amplification.",
    client: "Vans",
    services: "Strategy, Content, Production",
    blocks: [
      {
        type: "case-study-page",
        id: "vans-page",
        headline: "Integrated partnership including strategy, campaign, creation, and amplification.",
        texts: [
          "Each time we\u2019ve worked with Vans its been wildly different.",
          "We [captured and curated event coverage] of a Vans activation, [producing content] with editorial sensibility instead of the usual branded recap treatment.",
          "We [creative directed and produced a custom photo shoot] for a new product, building the entire visual world around the shoe from scratch.",
          "And we [provided social and creative strategy] for a seeding campaign: who gets it, how it enters the conversation, and what the content looks like when it starts showing up in feeds.",
          "Different deliverables across every engagement, but Vans showed up with the taste and intentionality that their audience already expects from them.",
        ],
        images: [
          { src: "", alt: "Vans campaign — video 1", vimeoId: "1171938513" },
          { src: "/images/companylogos/vans/vans02.png", alt: "Vans campaign — image 2" },
          { src: "", alt: "Vans campaign — video 3", vimeoId: "1171939954" },
          { src: "/images/companylogos/vans/vans04.jpg", alt: "Vans campaign — image 4" },
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
  title: "How We Work",
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
          body: "",
          items: [
            "Social strategy",
            "Brand strategy",
            "Creative strategy",
            "Audience mapping",
            "Content and channel strategy",
            "Founder-forward strategy",
            "Ad concepts",
          ],
        },
        {
          title: "Develop",
          body: "",
          items: [
            "Creative direction",
            "Creative briefs development",
            "Photo and video production",
            "Event production",
            "Guest list curation",
            "Merch design and production",
            "Zine and print production",
            "Campaign production",
          ],
        },
        {
          title: "Distribute",
          body: "",
          items: [
            "Tastemaker seeding",
            "Curated page coordination",
            "Clipping campaigns",
            "Creator and talent placements",
            "Owned channel distribution",
            "Paid distribution coordination",
          ],
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
  title: "",
  tags: ["Culture", "Trends"],
  description: "A window into the cultural currents shaping tomorrow.",
  client: "Welcome Labs",
  services: "Research, Analysis",
  blocks: [
    {
      type: "about",
      id: "insight-about",
      paragraphs: [
        "Great brands are great media companies. Welcome is a creative agency that helps companies turn ambitious products into cultural conversation. We create work that\u2019s culturally elevated and built to scale.",
        "What makes us different is simple: we built our agency on the back of a media brand we run ourselves. A publication with over 1.5 million followers that gives us real-time cultural intelligence, a creative network rooted in authentic relationships, and distribution infrastructure most agencies have to rent.",
        "We design strategies, develop content, and distribute through the channels and communities where quality attention really forms.",
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
