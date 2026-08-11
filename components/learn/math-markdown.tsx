"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

// Renders text that may contain LaTeX (inline $...$ and block $$...$$) plus
// standard markdown. Used for problem statements, tutor replies, and the
// student's own formula input preview in the Socratic problem solver.
export function MathMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ?? "overflow-x-auto"}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
