export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e879f9] border-t-transparent" aria-hidden />
      <p className="mt-3 text-sm text-muted-foreground">Loading chat...</p>
    </div>
  )
}
