/**
 * Tool Registry (Phase 39)
 * Manages available tools and custom tool builder
 */
import { CoreTool } from "ai";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  averageLatency: number;
  successRate: number;
}

export class ToolRegistry {
  private static tools: Map<string, CoreTool> = new Map();
  private static metadata: Map<string, ToolMetadata> = new Map();

  /**
   * Register a tool
   */
  static register(
    id: string,
    tool: CoreTool,
    metadata: Omit<ToolMetadata, "id">
  ): void {
    this.tools.set(id, tool);
    this.metadata.set(id, {
      id,
      ...metadata,
    });
  }

  /**
   * Get a tool by ID
   */
  static get(id: string): CoreTool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all tools
   */
  static getAll(): Array<{ tool: CoreTool; metadata: ToolMetadata }> {
    return Array.from(this.tools.entries()).map(([id, tool]) => ({
      tool,
      metadata: this.metadata.get(id)!,
    }));
  }

  /**
   * Get tools by category
   */
  static getByCategory(category: string): Array<{ tool: CoreTool; metadata: ToolMetadata }> {
    return this.getAll().filter(({ metadata }) => metadata.category === category);
  }

  /**
   * Record tool usage
   */
  static async recordUsage(
    toolId: string,
    success: boolean,
    latency: number
  ): Promise<void> {
    const metadata = this.metadata.get(toolId);
    if (!metadata) return;

    // Update metrics (simplified - would use database in production)
    metadata.usageCount++;
    metadata.averageLatency =
      (metadata.averageLatency * (metadata.usageCount - 1) + latency) /
      metadata.usageCount;
    metadata.successRate =
      (metadata.successRate * (metadata.usageCount - 1) + (success ? 1 : 0)) /
      metadata.usageCount;
  }
}
