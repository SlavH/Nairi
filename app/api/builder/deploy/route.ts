/**
 * Builder Deployment API (Phase 27)
 * Deploy projects to various platforms
 */
import { NextRequest, NextResponse } from "next/server";
import { DeploymentManager, DeploymentConfig } from "@/lib/builder/deployment";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const deploySchema = z.object({
  projectId: z.string().uuid(),
  platform: z.enum(["vercel", "netlify", "github-pages"]),
  projectName: z.string().min(1).max(100),
  environment: z.record(z.string()).optional(),
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const body = await req.json();
    const { projectId, platform, projectName, environment } = deploySchema.parse(body);

    const supabase = await createClient();

    // Get project files
    const { data: project, error: projectError } = await supabase
      .from("builder_projects")
      .select("files")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectError || !project) {
      return handleError(validationError("Project not found"));
    }

    // Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from("builder_deployments")
      .insert({
        project_id: projectId,
        platform,
        status: "pending",
        deployed_by: userId,
      })
      .select()
      .single();

    if (deployError) throw deployError;

    // Deploy
    const config: DeploymentConfig = {
      platform,
      projectName,
      files: project.files as Record<string, string>,
      environment,
    };

    const result = await DeploymentManager.deploy(config);

    // Update deployment record
    await supabase
      .from("builder_deployments")
      .update({
        status: result.success ? "success" : "failed",
        url: result.url,
        deployment_id: result.deploymentId,
        error_message: result.error,
        completed_at: new Date().toISOString(),
      })
      .eq("id", deployment.id);

    return NextResponse.json({
      success: result.success,
      deployment: {
        id: deployment.id,
        ...result,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", { errors: error.errors }));
    }
    return handleError(error);
  }
});
