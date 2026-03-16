import { CreditsPanel } from "@/components/dashboard/credits-panel"

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Credits & Rewards</h1>
        <p className="text-muted-foreground mt-1">
          Manage your credits, earn rewards, and invite friends.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreditsPanel />
      </div>
    </div>
  )
}
