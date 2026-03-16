"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BuilderElement } from "./drag-drop-canvas"
import { Smartphone, Tablet, Monitor, X, ExternalLink } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  elements: BuilderElement[]
}

const VIEWPORT_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: 1280
}

export function PreviewModal({ open, onOpenChange, elements }: PreviewModalProps) {
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop")

  // Generate HTML from elements
  const generateHTML = () => {
    const elementsHTML = elements.map((el) => {
      const style = {
        ...(el.styles || {}),
        position: 'relative' as const,
      }
      
      const styleString = Object.entries(style)
        .map(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          return `${cssKey}: ${value}`
        })
        .join('; ')

      switch (el.type) {
        case "container":
          return `<div style="${styleString}" class="${el.props.className || ''}">${el.props.children || ''}</div>`
        case "heading":
          const level = el.props.level || "h2"
          return `<${level} style="${styleString}" class="${el.props.className || ''}">${el.props.text || 'Heading'}</${level}>`
        case "paragraph":
          return `<p style="${styleString}" class="${el.props.className || ''}">${el.props.text || 'Paragraph'}</p>`
        case "button":
          return `<button style="${styleString}" class="${el.props.className || ''}">${el.props.text || 'Button'}</button>`
        case "image":
          return `<img src="${el.props.src || 'https://via.placeholder.com/400x300'}" alt="${el.props.alt || ''}" style="${styleString}" class="${el.props.className || ''}" />`
        case "section":
          return `<section style="${styleString}" class="${el.props.className || ''}">${el.props.children || ''}</section>`
        default:
          return `<div style="${styleString}" class="${el.props.className || ''}">${el.label}</div>`
      }
    }).join('\n')

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    button {
      cursor: pointer;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      background: #6366f1;
      color: white;
      font-size: 1rem;
    }
    button:hover {
      background: #4f46e5;
    }
  </style>
</head>
<body>
  ${elementsHTML}
</body>
</html>
    `
  }

  const htmlContent = generateHTML()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Preview
              <Badge variant="secondary" className="text-xs">
                {elements.length} element{elements.length !== 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Viewport Selector */}
              <div className="flex items-center rounded-lg border p-1">
                {[
                  { value: "mobile" as const, icon: <Smartphone className="h-4 w-4" />, label: "375px" },
                  { value: "tablet" as const, icon: <Tablet className="h-4 w-4" />, label: "768px" },
                  { value: "desktop" as const, icon: <Monitor className="h-4 w-4" />, label: "1280px" }
                ].map((vp) => (
                  <Button
                    key={vp.value}
                    variant={viewport === vp.value ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1 px-2"
                    onClick={() => setViewport(vp.value)}
                  >
                    {vp.icon}
                    <span className="text-xs text-muted-foreground">{vp.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mx-auto" style={{ maxWidth: `${VIEWPORT_WIDTHS[viewport]}px` }}>
            <div className="rounded-lg border bg-white shadow-lg overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 border-b bg-gray-100 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 rounded bg-white px-3 py-1 text-xs text-muted-foreground">
                  https://preview.nairi.app
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              
              {/* Preview Content */}
              <div className="bg-white">
                {elements.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-sm">No elements to preview</p>
                      <p className="text-xs mt-1">Add components to see them here</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    srcDoc={htmlContent}
                    className="w-full border-0"
                    style={{ height: '600px' }}
                    title="Preview"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
