import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FlowFeed } from "@/components/flow/flow-feed"
import { getSessionOrBypass } from "@/lib/auth"

export default async function FlowPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch feed posts
  const { data: rawPosts, error: postsError } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch profiles for the posts
  const userIds = [...new Set(rawPosts?.map(p => p.user_id) || [])]
  const { data: profiles } = userIds.length > 0 
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
    : { data: [] }

  // Fetch post interactions
  const postIds = rawPosts?.map(p => p.id) || []
  const { data: interactions } = postIds.length > 0
    ? await supabase.from("post_interactions").select("id, interaction_type, user_id, post_id").in("post_id", postIds)
    : { data: [] }

  // Combine the data
  const posts = rawPosts?.map(post => ({
    ...post,
    profiles: profiles?.find(p => p.id === post.user_id) || { id: post.user_id, full_name: 'Anonymous', avatar_url: null },
    post_interactions: interactions?.filter(i => i.post_id === post.id) || []
  })) || []

  // Fetch saved posts for the user
  const { data: savedPosts } = await supabase.from("saved_posts").select("post_id").eq("user_id", user.id)

  // Fetch following list
  const { data: following } = await supabase.from("user_follows").select("following_id").eq("follower_id", user.id)

  return (
    <FlowFeed
      initialPosts={posts || []}
      savedPostIds={savedPosts?.map((s) => s.post_id) || []}
      followingIds={following?.map((f) => f.following_id) || []}
      userId={user.id}
    />
  )
}
