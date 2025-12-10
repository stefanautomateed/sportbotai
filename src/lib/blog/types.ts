// Blog system types

export interface BlogGenerationConfig {
  keyword: string;
  keywordId?: string;
  forceRegenerate?: boolean;
}

export interface ResearchResult {
  facts: string[];
  statistics: string[];
  recentNews: string[];
  sources: string[];
  relatedTopics: string[];
}

export interface OutlineSection {
  heading: string;
  subheadings: string[];
  keyPoints: string[];
}

export interface BlogOutline {
  title: string;
  metaDescription: string;
  sections: OutlineSection[];
  estimatedWordCount: number;
}

export interface GeneratedContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML content
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  tags: string[];
  category: string;
}

export interface ImageGenerationResult {
  url: string;
  alt: string;
  prompt: string;
}

export interface BlogGenerationResult {
  success: boolean;
  postId?: string;
  slug?: string;
  error?: string;
  cost?: number;
  duration?: number;
}

export interface GenerationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

// Seed keywords for sports analytics (optimized for SportBot AI use case)
// Goal: Attract users searching for sports analysis tools, AI predictions, match insights
export const SEED_KEYWORDS = [
  // Product-aligned: AI & Tools (high intent)
  "best AI sports analysis tools 2025",
  "how AI predicts football match outcomes",
  "machine learning sports predictions explained",
  "automated sports analytics platforms",
  "AI powered match analysis software",
  
  // Sports Analysis (core value proposition)
  "how to analyze football matches like a pro",
  "soccer match prediction factors",
  "NBA game analysis techniques",
  "tennis match outcome predictors",
  "head to head statistics importance sports",
  "team form analysis for predictions",
  
  // Probability & Statistics (educational)
  "understanding probability in sports outcomes",
  "how bookmakers calculate odds explained",
  "implied probability vs true probability",
  "expected value sports analysis guide",
  "statistical models for sports predictions",
  
  // Specific Features (what SportBot offers)
  "real time sports data analysis",
  "value betting detection methods",
  "risk assessment in sports predictions",
  "Kelly criterion sports betting calculator",
  "momentum analysis in football matches",
  
  // Sport-specific deep dives
  "Premier League match analysis guide",
  "Champions League prediction factors",
  "NFL game analysis statistics",
  "NBA player performance metrics",
  "how weather affects soccer matches",
  
  // Educational & Responsible
  "sports betting vs sports analysis difference",
  "data driven sports predictions beginners",
  "why most sports predictions fail",
  "responsible approach to sports analytics",
  "free sports analysis tools comparison",
  
  // Long-tail high-intent
  "how to predict football match results accurately",
  "best way to analyze upcoming matches",
  "understanding home advantage statistics",
  "what data do professional analysts use",
  "building sports prediction strategy",
];

// Blog categories
export const BLOG_CATEGORIES = [
  "Betting Fundamentals",
  "Sports Analysis",
  "Statistics & Data",
  "Risk Management",
  "Market Insights",
  "Educational Guides",
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];
