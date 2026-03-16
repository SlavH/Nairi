/**
 * Nairi AI Workflow Builder - Layout
 */

import { Metadata } from 'next'
import { WorkflowProvider } from '@/lib/workflows/store'

export const metadata: Metadata = {
  title: 'Workflow Builder | Nairi',
  description: 'Build powerful AI workflows with drag-and-drop simplicity',
}

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <WorkflowProvider>{children}</WorkflowProvider>
}
