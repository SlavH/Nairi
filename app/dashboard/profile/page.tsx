import { redirect } from 'next/navigation'

// Profile page redirects to settings (profile is a tab in settings)
export default function ProfilePage() {
  redirect('/dashboard/settings')
}
