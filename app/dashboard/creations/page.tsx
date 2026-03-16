import { redirect } from "next/navigation"

/** Dashboard creations list redirects to workspace (single source of truth). */
export default function DashboardCreationsPage() {
  redirect("/workspace")
}
