/**
 * Code Quality Tools (Phase 25)
 * Provides linting, formatting, and code quality metrics
 * ESLint is optional - dynamically imported to avoid build failures
 */
export interface CodeQualityResult {
  score: number; // 0-100
  issues: Array<{
    line: number;
    column: number;
    severity: "error" | "warning" | "info";
    message: string;
    rule: string;
  }>;
  metrics: {
    linesOfCode: number;
    complexity: number;
    maintainabilityIndex: number;
  };
}

export class CodeQualityAnalyzer {
  /**
   * Analyze code quality
   */
  static async analyzeCode(
    code: string,
    language: "typescript" | "javascript" | "tsx" | "jsx" = "typescript"
  ): Promise<CodeQualityResult> {
    const issues: CodeQualityResult["issues"] = [];
    let score = 100;

    // Basic metrics
    const linesOfCode = code.split("\n").length;
    const complexity = this.calculateComplexity(code);

    // ESLint analysis (if available - optional dependency)
    try {
      // Dynamic import to avoid build-time dependency
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        useEslintrc: false,
        baseConfig: {
          extends: ["eslint:recommended"],
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
          },
        },
      });

      const results = await eslint.lintText(code, {
        filePath: `file.${language === "typescript" || language === "tsx" ? "ts" : "js"}`,
      });

      for (const result of results) {
        for (const message of result.messages) {
          issues.push({
            line: message.line || 0,
            column: message.column || 0,
            severity: message.severity === 2 ? "error" : message.severity === 1 ? "warning" : "info",
            message: message.message,
            rule: message.ruleId || "unknown",
          });

          // Deduct points for issues
          if (message.severity === 2) score -= 5; // Error
          else if (message.severity === 1) score -= 2; // Warning
        }
      }
    } catch (error) {
      // ESLint not available or error - continue with basic analysis
      console.warn("ESLint analysis failed:", error);
    }

    // Calculate maintainability index (simplified)
    const maintainabilityIndex = Math.max(
      0,
      Math.min(
        100,
        171 -
          5.2 * Math.log(complexity) -
          0.23 * Math.log(linesOfCode) -
          16.2 * Math.log(issues.length + 1)
      )
    );

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      metrics: {
        linesOfCode,
        complexity,
        maintainabilityIndex: Math.round(maintainabilityIndex),
      },
    };
  }

  /**
   * Format code. Currently returns the code unchanged; Prettier (or similar) can be
   * integrated later for language-specific formatting. Language is accepted for API compatibility.
   */
  static formatCode(code: string, _language: string): string {
    return code;
  }

  /**
   * Calculate code complexity (simplified)
   */
  private static calculateComplexity(code: string): number {
    // Count control flow statements
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s*{/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // Ternary operators
    ];

    let complexity = 1; // Base complexity
    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Get code review suggestions
   */
  static getReviewSuggestions(analysis: CodeQualityResult): string[] {
    const suggestions: string[] = [];

    if (analysis.score < 70) {
      suggestions.push("Code quality score is below recommended threshold. Consider refactoring.");
    }

    if (analysis.metrics.complexity > 20) {
      suggestions.push("High cyclomatic complexity detected. Consider breaking down into smaller functions.");
    }

    const errorCount = analysis.issues.filter((i) => i.severity === "error").length;
    if (errorCount > 0) {
      suggestions.push(`${errorCount} error(s) found. Please fix before deployment.`);
    }

    if (analysis.metrics.linesOfCode > 500) {
      suggestions.push("File is quite long. Consider splitting into smaller modules.");
    }

    return suggestions;
  }
}
