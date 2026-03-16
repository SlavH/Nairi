import { redirect } from "next/navigation"

/** Dashboard creation detail redirects to workspace detail. */
export default async function DashboardCreationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/workspace/${id}`)
}
