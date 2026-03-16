import { redirect } from "next/navigation"

/**
 * Redirect /builder-v2 to /builder for backwards compatibility.
 * The builder lives at /builder but dashboard and sitemap reference /builder-v2.
 */
export default function BuilderV2Redirect() {
  redirect("/builder")
}
