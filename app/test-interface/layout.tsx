import { notFound } from "next/navigation"

/**
 * Test interface is for development only. In production, this route returns 404.
 */
export default function TestInterfaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }
  return <>{children}</>
}
