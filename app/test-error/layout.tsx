import { notFound } from "next/navigation"

/**
 * Error testing page is for development/Sentry testing only. In production, this route returns 404.
 */
export default function TestErrorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }
  return <>{children}</>
}
