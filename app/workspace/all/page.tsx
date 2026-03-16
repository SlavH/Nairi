import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceAllView } from "@/components/workspace/workspace-all-view"
import { getSessionOrBypass } from "@/lib/auth"

export default async function WorkspaceAllPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const type = typeof params.type === 'string' ? params.type : 'all'
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  // Try to fetch creations, handle gracefully if table doesn't exist
  let creations: any[] = []
  try {
    let query = supabase
      .from("creations")
      .select("*")
      .eq("user_id", user.id)

    // Apply type filter
    if (type !== 'all') {
      query = query.eq('type', type)
    }

    // Apply search filter
    if (search) {
      query = query.or(`prompt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'name':
        query = query.order('prompt', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data } = await query
    creations = data || []
  } catch {
    // Table might not exist yet
    creations = []
  }

  return <WorkspaceAllView creations={creations} initialSearch={search} initialType={type} initialSort={sort} />
}
