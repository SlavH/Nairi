import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreatePost } from "@/components/flow/create-post"
import { getSessionOrBypass } from "@/lib/auth"

export default async function CreatePostPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  return <CreatePost userId={user.id} />
}
