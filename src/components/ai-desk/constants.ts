/**
 * AI Desk Chat Constants
 * 
 * Fallback questions, placeholder examples, and helper functions.
 */

/**
 * Fallback questions when dynamic prompts fail to load
 */
export const FALLBACK_QUESTIONS = [
    // Trending question (reliable fallback)
    "How many goals has Haaland scored this season?",
    // Injuries
    "What's the latest injury news for Arsenal?",
    // Standings
    "Who's top of the Serie A table?",
    // Stats
    "How many goals has Haaland scored this season?",
    // Transfers
    "Any transfer rumors for the January window?",
    // Fixtures
    "When do Liverpool play next in the Premier League?",
];

/**
 * Rotating placeholder examples to show users how to ask questions
 */
export const PLACEHOLDER_EXAMPLES = [
    "Try: Liverpool injury updates",
    "Try: Jokic avg points this season",
    "Try: Head to head Inter vs Milan",
    "Try: Liverpool injury updates",
    "Try: Champions League standings",
    "Try: Who's the top scorer in La Liga?",
    "Try: Analyze Man City vs Arsenal",
    "Try: Mbappe stats this season",
];

/**
 * Get initial questions for SSR
 */
export function getInitialQuestions(count: number): string[] {
    return FALLBACK_QUESTIONS.slice(0, count);
}

/**
 * Strip markdown formatting from AI responses
 * Removes bold (**text**), headers (##), and other markdown syntax
 */
export function stripMarkdown(text: string): string {
    return text
        // Remove bold markers: **text** or __text__
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // Remove italic markers: *text* or _text_ (single)
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
        .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
        // Remove headers: ## text or ### text
        .replace(/^#{1,6}\s+/gm, '')
        // Clean up numbered list markers at start: 1. 2. etc
        .replace(/^\d+\.\s+/gm, '')
        .trim();
}
