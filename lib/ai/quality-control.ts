/**
 * AI Response Quality Control (Phase 37)
 * Scores, filters, and moderates AI responses
 */
export interface QualityScore {
  overall: number; // 0-100
  relevance: number;
  coherence: number;
  completeness: number;
  safety: number;
  issues: string[];
}

export class QualityController {
  /**
   * Score response quality
   */
  static scoreResponse(
    response: string,
    prompt: string
  ): QualityScore {
    const issues: string[] = [];
    let relevance = 100;
    let coherence = 100;
    let completeness = 100;
    let safety = 100;

    // Check relevance
    const promptKeywords = this.extractKeywords(prompt);
    const responseKeywords = this.extractKeywords(response);
    const matchRatio = this.calculateMatch(promptKeywords, responseKeywords);
    relevance = matchRatio * 100;

    if (relevance < 50) {
      issues.push("Response may not be relevant to the prompt");
    }

    // Check coherence (basic heuristics)
    const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 2 && response.length > 100) {
      coherence -= 20;
      issues.push("Response may lack coherence");
    }

    // Check completeness
    if (response.length < 50 && prompt.length > 100) {
      completeness -= 30;
      issues.push("Response may be incomplete");
    }

    // Check safety (basic content filtering)
    const unsafePatterns = [
      /\b(violence|harmful|dangerous)\b/i,
      /\b(illegal|unlawful)\b/i,
    ];

    for (const pattern of unsafePatterns) {
      if (pattern.test(response)) {
        safety -= 20;
        issues.push("Response may contain unsafe content");
      }
    }

    const overall =
      (relevance + coherence + completeness + safety) / 4;

    return {
      overall: Math.round(overall),
      relevance: Math.round(relevance),
      coherence: Math.round(coherence),
      completeness: Math.round(completeness),
      safety: Math.round(safety),
      issues,
    };
  }

  /**
   * Filter response based on quality threshold
   */
  static shouldFilter(score: QualityScore, threshold: number = 60): boolean {
    return score.overall < threshold || score.safety < 50;
  }

  /**
   * Moderate content
   */
  static moderateContent(content: string): {
    allowed: boolean;
    reason?: string;
  } {
    // Basic content moderation
    const blockedPatterns = [
      { pattern: /\b(kill|murder|suicide)\b/i, reason: "Violent content" },
      { pattern: /\b(hack|exploit|bypass)\s+(security|system)\b/i, reason: "Security violation" },
    ];

    for (const { pattern, reason } of blockedPatterns) {
      if (pattern.test(content)) {
        return { allowed: false, reason };
      }
    }

    return { allowed: true };
  }

  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return [...new Set(words)];
  }

  private static calculateMatch(
    keywords1: string[],
    keywords2: string[]
  ): number {
    if (keywords1.length === 0) return 1;
    const matches = keywords1.filter((k) => keywords2.includes(k)).length;
    return matches / keywords1.length;
  }
}
