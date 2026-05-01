/**
 * Custom Tool Builder (Phase 39)
 * Allows users to create custom tools
 */
import { tool as aiTool } from "ai";
import { z } from "zod";

export interface CustomToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export class CustomToolBuilder {
  /**
   * Create a custom tool from definition
   */
  static createTool(definition: CustomToolDefinition) {
    return aiTool({
      description: definition.description,
      parameters: definition.parameters,
      execute: definition.execute,
    } as unknown as Parameters<typeof aiTool>[0]);
  }

  /**
   * Validate tool definition
   */
  static validateDefinition(definition: CustomToolDefinition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!definition.name || definition.name.trim().length === 0) {
      errors.push("Tool name is required");
    }

    if (!definition.description || definition.description.trim().length === 0) {
      errors.push("Tool description is required");
    }

    if (!definition.parameters) {
      errors.push("Tool parameters are required");
    }

    if (typeof definition.execute !== "function") {
      errors.push("Tool execute function is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
