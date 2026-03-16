export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-950 via-pink-950 to-cyan-950">
      {children}
    </div>
  )
}