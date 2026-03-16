/**
 * Accessibility Checker (Phase 66)
 */
export interface A11yIssue {
  type: "error" | "warning";
  message: string;
  element?: string;
}

export class AccessibilityChecker {
  /**
   * Check for common accessibility issues
   */
  static checkHTML(html: string): A11yIssue[] {
    const issues: A11yIssue[] = [];

    // Check for missing alt text on images
    const imgWithoutAlt = html.match(/<img[^>]+(?!alt=)[^>]*>/gi);
    if (imgWithoutAlt) {
      issues.push({
        type: "error",
        message: "Images missing alt text",
        element: "img",
      });
    }

    // Check for missing labels on inputs
    const inputWithoutLabel = html.match(/<input[^>]+(?!aria-label)[^>]*>/gi);
    if (inputWithoutLabel) {
      issues.push({
        type: "warning",
        message: "Inputs should have labels or aria-label",
        element: "input",
      });
    }

    // Check for missing heading hierarchy
    const headings = html.match(/<h[1-6][^>]*>/gi) || [];
    let lastLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.match(/h([1-6])/i)?.[1] || "1");
      if (level > lastLevel + 1) {
        issues.push({
          type: "warning",
          message: `Heading hierarchy skipped: h${lastLevel} to h${level}`,
          element: `h${level}`,
        });
      }
      lastLevel = level;
    }

    return issues;
  }
}
