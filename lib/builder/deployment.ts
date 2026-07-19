/**
 * Builder Deployment System (Phase 27)
 * Deploy projects to multiple platforms.
 *
 * Real deployment is implemented for Vercel when VERCEL_TOKEN is configured.
 * Netlify and GitHub Pages require additional credentials/setup and are not
 * enabled by default — they return a clear error instead of a fake URL.
 */
export type DeploymentPlatform = "vercel" | "netlify" | "github-pages";

export interface DeploymentConfig {
  platform: DeploymentPlatform;
  projectName: string;
  files: Record<string, string>;
  environment?: Record<string, string>;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
}

export class DeploymentManager {
  /**
   * Deploy to Vercel using the REST API.
   * Requires VERCEL_TOKEN (and VERCEL_TEAM_ID optionally).
   */
  static async deployToVercel(config: DeploymentConfig): Promise<DeploymentResult> {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return {
        success: false,
        error:
          "Vercel deployment is not configured. Set VERCEL_TOKEN in the environment to enable live deploys.",
      };
    }

    try {
      const teamId = process.env.VERCEL_TEAM_ID
      const base = "https://api.vercel.com"
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      // Find or create the project.
      const projectName = config.projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100) || "nairi-project"

      const listUrl = teamId
        ? `${base}/v9/projects?teamId=${teamId}`
        : `${base}/v9/projects`
      const listRes = await fetch(listUrl, { headers, cache: "no-store" })
      const listJson = (await listRes.json()) as { projects?: Array<{ id: string; name: string }> }
      let projectId = listJson.projects?.find((p) => p.name === projectName)?.id

      if (!projectId) {
        const createRes = await fetch(listUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ name: projectName, framework: null }),
        })
        if (!createRes.ok) {
          const err = await createRes.text()
          return { success: false, error: `Failed to create Vercel project: ${err}` }
        }
        const created = (await createRes.json()) as { id: string }
        projectId = created.id
      }

      // Prepare deployment files payload.
      const files = Object.entries(config.files).map(([file, data]) => ({
        file: file.replace(/^\/+/, ""),
        data,
      }))

      const deployUrl = teamId
        ? `${base}/v13/deployments?teamId=${teamId}`
        : `${base}/v13/deployments`
      const deployRes = await fetch(deployUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: projectName,
          projectId,
          target: "production",
          files,
        }),
      })

      if (!deployRes.ok) {
        const err = await deployRes.text()
        return { success: false, error: `Vercel deploy failed: ${err}` }
      }

      const deployJson = (await deployRes.json()) as {
        id: string
        url?: string
        readyState?: string
      }

      return {
        success: true,
        url: deployJson.url ? `https://${deployJson.url}` : undefined,
        deploymentId: deployJson.id,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Vercel deployment error",
      }
    }
  }

  /**
   * Deploy to Netlify.
   * Requires NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID (not configured by default).
   */
  static async deployToNetlify(config: DeploymentConfig): Promise<DeploymentResult> {
    const token = process.env.NETLIFY_AUTH_TOKEN
    const siteId = process.env.NETLIFY_SITE_ID
    if (!token || !siteId) {
      return {
        success: false,
        error:
          "Netlify deployment is not configured. Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID to enable it.",
      }
    }
    // Real Netlify deploy (zip + /deploys) would be implemented here.
    return {
      success: false,
      error: "Netlify deployment is not implemented yet.",
    }
  }

  /**
   * Deploy to GitHub Pages.
   * Requires GITHUB_TOKEN + a target repo. Not configured by default.
   */
  static async deployToGitHubPages(config: DeploymentConfig): Promise<DeploymentResult> {
    if (!process.env.GITHUB_TOKEN) {
      return {
        success: false,
        error:
          "GitHub Pages deployment is not configured. Set GITHUB_TOKEN to enable it.",
      }
    }
    return {
      success: false,
      error: "GitHub Pages deployment is not implemented yet.",
    }
  }

  /**
   * Deploy to platform
   */
  static async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    switch (config.platform) {
      case "vercel":
        return this.deployToVercel(config)
      case "netlify":
        return this.deployToNetlify(config)
      case "github-pages":
        return this.deployToGitHubPages(config)
      default:
        return {
          success: false,
          error: `Unsupported platform: ${config.platform}`,
        }
    }
  }

  /**
   * Get deployment history
   */
  static async getDeploymentHistory(projectId: string): Promise<Array<{
    id: string
    platform: DeploymentPlatform
    url: string
    deployedAt: Date
    status: "success" | "failed"
  }>> {
    // Would query deployment history from database
    return []
  }
}
