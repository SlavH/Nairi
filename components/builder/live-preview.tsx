"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Smartphone, 
  Tablet, 
  Monitor,
  Code,
  Eye,
  Copy,
  Check,
  Download,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LivePreviewProps {
  code: string
  isLoading?: boolean
  className?: string
}

type ViewportSize = "mobile" | "tablet" | "desktop" | "full"

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; label: string }> = {
  mobile: { width: "375px", label: "Mobile" },
  tablet: { width: "768px", label: "Tablet" },
  desktop: { width: "1024px", label: "Desktop" },
  full: { width: "100%", label: "Full" }
}

export function LivePreview({ code, isLoading, className }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("full")
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate the HTML document for the iframe
  const generatePreviewHTML = useCallback((jsxCode: string) => {
    // Escape the JSX code for safe embedding in HTML script tag
    // We need to escape </script> to prevent breaking out of the script tag
    // and handle special characters that could break the HTML
    const escapedCode = jsxCode
      .replace(/<\/script>/gi, '<\\/script>')  // Escape closing script tags
      .replace(/<!--/g, '<\\!--')  // Escape HTML comments
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { 
      font-family: 'Inter', system-ui, -apple-system, sans-serif; 
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .error-display {
      padding: 20px;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin: 20px;
      font-family: ui-monospace, monospace;
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.5;
    }
  </style>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
          },
          colors: {
            border: "hsl(220 13% 91%)",
            input: "hsl(220 13% 91%)",
            ring: "hsl(262 83% 58%)",
            background: "hsl(0 0% 100%)",
            foreground: "hsl(224 71% 4%)",
            primary: {
              DEFAULT: "hsl(262 83% 58%)",
              foreground: "hsl(0 0% 100%)",
            },
            secondary: {
              DEFAULT: "hsl(220 14% 96%)",
              foreground: "hsl(224 71% 4%)",
            },
            muted: {
              DEFAULT: "hsl(220 14% 96%)",
              foreground: "hsl(220 9% 46%)",
            },
            accent: {
              DEFAULT: "hsl(220 14% 96%)",
              foreground: "hsl(224 71% 4%)",
            },
            destructive: {
              DEFAULT: "hsl(0 84% 60%)",
              foreground: "hsl(0 0% 100%)",
            },
          },
          animation: {
            'fade-in': 'fadeIn 0.5s ease-out',
            'slide-up': 'slideUp 0.5s ease-out',
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0' },
              '100%': { opacity: '1' },
            },
            slideUp: {
              '0%': { opacity: '0', transform: 'translateY(20px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
          },
        }
      }
    }
  </script>
</head>
<body class="bg-background text-foreground">
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useCallback, useMemo, useRef, useReducer, createContext, useContext, Fragment } = React;
    
    // Utility function for class names
    const cn = (...classes) => classes.filter(Boolean).join(' ');
    
    // Comprehensive Lucide-style icon library for generated components
    const Icon = ({ name, className = "w-4 h-4", ...props }) => {
      const icons = {
        'chevron-down': <path d="m6 9 6 6 6-6"/>,
        'chevron-right': <path d="m9 18 6-6-6-6"/>,
        'chevron-left': <path d="m15 18-6-6 6-6"/>,
        'chevron-up': <path d="m18 15-6-6-6 6"/>,
        'check': <polyline points="20 6 9 17 4 12"/>,
        'x': <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
        'menu': <><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></>,
        'star': <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
        'arrow-right': <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
        'arrow-left': <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
        'plus': <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
        'minus': <line x1="5" y1="12" x2="19" y2="12"/>,
        'search': <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
        'user': <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
        'settings': <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
        'home': <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
        'mail': <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
        'phone': <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
        'calendar': <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
        'clock': <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
        'heart': <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
        'trash': <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
        'edit': <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
        'copy': <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
        'download': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
        'upload': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
        'share': <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
        'eye': <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
        'eye-off': <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
        'lock': <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
        'unlock': <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>,
        'bell': <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
        'image': <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
        'video': <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
        'music': <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
        'file': <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
        'folder': <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
        'shopping-cart': <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
        'credit-card': <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
        'map-pin': <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
        'globe': <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
        'sun': <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
        'moon': <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
        'zap': <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
        'loader': <><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
        'play': <polygon points="5 3 19 12 5 21 5 3"/>,
        'pause': <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
        'volume': <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>,
        'send': <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
        'message-circle': <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>,
        'sparkles': <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
        'rocket': <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>,
        'filter': <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
        'refresh': <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
        'external-link': <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
        'info': <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
        'alert-circle': <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
        'check-circle': <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
        'x-circle': <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
        'bar-chart': <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
        'trending-up': <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
        'trending-down': <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
      };
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          {icons[name] || icons['x']}
        </svg>
      );
    };
    
    // Backward-compatible individual icon components
    const ChevronDown = ({ className = "w-4 h-4" }) => <Icon name="chevron-down" className={className} />;
    const ChevronRight = ({ className = "w-4 h-4" }) => <Icon name="chevron-right" className={className} />;
    const ChevronLeft = ({ className = "w-4 h-4" }) => <Icon name="chevron-left" className={className} />;
    const ChevronUp = ({ className = "w-4 h-4" }) => <Icon name="chevron-up" className={className} />;
    const Check = ({ className = "w-4 h-4" }) => <Icon name="check" className={className} />;
    const X = ({ className = "w-4 h-4" }) => <Icon name="x" className={className} />;
    const Menu = ({ className = "w-4 h-4" }) => <Icon name="menu" className={className} />;
    const Star = ({ className = "w-4 h-4", filled = false }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    );
    const ArrowRight = ({ className = "w-4 h-4" }) => <Icon name="arrow-right" className={className} />;
    const ArrowLeft = ({ className = "w-4 h-4" }) => <Icon name="arrow-left" className={className} />;
    const Plus = ({ className = "w-4 h-4" }) => <Icon name="plus" className={className} />;
    const Minus = ({ className = "w-4 h-4" }) => <Icon name="minus" className={className} />;
    const Search = ({ className = "w-4 h-4" }) => <Icon name="search" className={className} />;
    const User = ({ className = "w-4 h-4" }) => <Icon name="user" className={className} />;
    const Settings = ({ className = "w-4 h-4" }) => <Icon name="settings" className={className} />;
    const Home = ({ className = "w-4 h-4" }) => <Icon name="home" className={className} />;
    const Mail = ({ className = "w-4 h-4" }) => <Icon name="mail" className={className} />;
    const Phone = ({ className = "w-4 h-4" }) => <Icon name="phone" className={className} />;
    const Calendar = ({ className = "w-4 h-4" }) => <Icon name="calendar" className={className} />;
    const Clock = ({ className = "w-4 h-4" }) => <Icon name="clock" className={className} />;
    const Heart = ({ className = "w-4 h-4" }) => <Icon name="heart" className={className} />;
    const Trash = ({ className = "w-4 h-4" }) => <Icon name="trash" className={className} />;
    const Edit = ({ className = "w-4 h-4" }) => <Icon name="edit" className={className} />;
    const Copy = ({ className = "w-4 h-4" }) => <Icon name="copy" className={className} />;
    const Download = ({ className = "w-4 h-4" }) => <Icon name="download" className={className} />;
    const Upload = ({ className = "w-4 h-4" }) => <Icon name="upload" className={className} />;
    const Share = ({ className = "w-4 h-4" }) => <Icon name="share" className={className} />;
    const Eye = ({ className = "w-4 h-4" }) => <Icon name="eye" className={className} />;
    const EyeOff = ({ className = "w-4 h-4" }) => <Icon name="eye-off" className={className} />;
    const Lock = ({ className = "w-4 h-4" }) => <Icon name="lock" className={className} />;
    const Unlock = ({ className = "w-4 h-4" }) => <Icon name="unlock" className={className} />;
    const Bell = ({ className = "w-4 h-4" }) => <Icon name="bell" className={className} />;
    const Image = ({ className = "w-4 h-4" }) => <Icon name="image" className={className} />;
    const Video = ({ className = "w-4 h-4" }) => <Icon name="video" className={className} />;
    const Music = ({ className = "w-4 h-4" }) => <Icon name="music" className={className} />;
    const File = ({ className = "w-4 h-4" }) => <Icon name="file" className={className} />;
    const Folder = ({ className = "w-4 h-4" }) => <Icon name="folder" className={className} />;
    const ShoppingCart = ({ className = "w-4 h-4" }) => <Icon name="shopping-cart" className={className} />;
    const CreditCard = ({ className = "w-4 h-4" }) => <Icon name="credit-card" className={className} />;
    const MapPin = ({ className = "w-4 h-4" }) => <Icon name="map-pin" className={className} />;
    const Globe = ({ className = "w-4 h-4" }) => <Icon name="globe" className={className} />;
    const Sun = ({ className = "w-4 h-4" }) => <Icon name="sun" className={className} />;
    const Moon = ({ className = "w-4 h-4" }) => <Icon name="moon" className={className} />;
    const Zap = ({ className = "w-4 h-4" }) => <Icon name="zap" className={className} />;
    const Loader = ({ className = "w-4 h-4" }) => <Icon name="loader" className={className} />;
    const Play = ({ className = "w-4 h-4" }) => <Icon name="play" className={className} />;
    const Pause = ({ className = "w-4 h-4" }) => <Icon name="pause" className={className} />;
    const Volume = ({ className = "w-4 h-4" }) => <Icon name="volume" className={className} />;
    const Send = ({ className = "w-4 h-4" }) => <Icon name="send" className={className} />;
    const MessageCircle = ({ className = "w-4 h-4" }) => <Icon name="message-circle" className={className} />;
    const Sparkles = ({ className = "w-4 h-4" }) => <Icon name="sparkles" className={className} />;
    const Rocket = ({ className = "w-4 h-4" }) => <Icon name="rocket" className={className} />;
    const Filter = ({ className = "w-4 h-4" }) => <Icon name="filter" className={className} />;
    const RefreshCw = ({ className = "w-4 h-4" }) => <Icon name="refresh" className={className} />;
    const ExternalLink = ({ className = "w-4 h-4" }) => <Icon name="external-link" className={className} />;
    const Info = ({ className = "w-4 h-4" }) => <Icon name="info" className={className} />;
    const AlertCircle = ({ className = "w-4 h-4" }) => <Icon name="alert-circle" className={className} />;
    const CheckCircle = ({ className = "w-4 h-4" }) => <Icon name="check-circle" className={className} />;
    const XCircle = ({ className = "w-4 h-4" }) => <Icon name="x-circle" className={className} />;
    const BarChart = ({ className = "w-4 h-4" }) => <Icon name="bar-chart" className={className} />;
    const TrendingUp = ({ className = "w-4 h-4" }) => <Icon name="trending-up" className={className} />;
    const TrendingDown = ({ className = "w-4 h-4" }) => <Icon name="trending-down" className={className} />;
    
    try {
      // Execute the code and expose App to window
      ${escapedCode}
      
      // Make App available globally
      if (typeof App !== 'undefined') {
        window.App = App;
      }
      
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      
      // The code cleaning renames all components to App and exposes it to window
      // Check for App component and render
      if (typeof window.App === 'function') {
        root.render(React.createElement(window.App));
        window.parent.postMessage({ type: 'preview-loaded' }, '*');
      } else if (typeof App === 'function') {
        root.render(React.createElement(App));
        window.parent.postMessage({ type: 'preview-loaded' }, '*');
      } else {
        // Fallback: Try to find any function that looks like a component
        const componentCandidates = [
          'App', 'Component', 'Page', 'Main', 'LandingPage', 'Dashboard', 'Website', 'Home',
          'Counter', 'Game', 'Calculator', 'TodoApp', 'Portfolio', 'Form'
        ];
        
        let AppComponent = null;
        for (const name of componentCandidates) {
          try {
            const comp = eval(name);
            if (typeof comp === 'function') {
              AppComponent = comp;
              break;
            }
          } catch (e) {
            // Component not found, continue
          }
        }
        
        if (AppComponent) {
          root.render(React.createElement(AppComponent));
          window.parent.postMessage({ type: 'preview-loaded' }, '*');
        } else {
          throw new Error('No component found. The code must export a function component named App.');
        }
      }
    } catch (error) {
      const errorHtml = '<div class="error-display"><strong>Preview Error:</strong>\\n\\n' + 
        error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
        '</div>';
      document.getElementById('root').innerHTML = errorHtml;
      console.error('Preview Error:', error);
      window.parent.postMessage({ type: 'preview-error', error: error.message }, '*');
    }
  </script>
</body>
</html>`
    return htmlContent
  }, [])

  // Update iframe when code changes
  useEffect(() => {
    if (!code || !iframeRef.current) return
    
    setError(null)
    setPreviewLoading(true)
    
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    
    // Set timeout for preview loading (10 seconds)
    loadTimeoutRef.current = setTimeout(() => {
      setPreviewLoading(false)
      setError("Preview timed out. Click Refresh to try again.")
    }, 10000)
    
    try {
      // CRITICAL FIX: Convert full HTML document to React component
      let processedCode = code
      
      // Helper function to extract and convert body content
      const extractBodyContent = (htmlCode: string): string | null => {
        const bodyMatch = htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        if (!bodyMatch) return null
        
        let bodyContent = bodyMatch[1].trim()
        
        // Convert HTML attributes to JSX (class -> className, for -> htmlFor, etc.)
        bodyContent = bodyContent
          .replace(/\bclass=/g, 'className=')
          .replace(/\bfor=/g, 'htmlFor=')
          .replace(/\bstroke-width=/g, 'strokeWidth=')
          .replace(/\bstroke-linecap=/g, 'strokeLinecap=')
          .replace(/\bstroke-linejoin=/g, 'strokeLinejoin=')
          .replace(/\bfill-rule=/g, 'fillRule=')
          .replace(/\bclip-rule=/g, 'clipRule=')
          .replace(/\btabindex=/g, 'tabIndex=')
          .replace(/\breadonly/g, 'readOnly')
          .replace(/\bautocomplete=/g, 'autoComplete=')
          .replace(/\bautofocus/g, 'autoFocus')
          .replace(/\bmaxlength=/g, 'maxLength=')
          .replace(/\bminlength=/g, 'minLength=')
          .replace(/\bcellpadding=/g, 'cellPadding=')
          .replace(/\bcellspacing=/g, 'cellSpacing=')
          .replace(/\bcolspan=/g, 'colSpan=')
          .replace(/\browspan=/g, 'rowSpan=')
          .replace(/\bframeborder=/g, 'frameBorder=')
          .replace(/\ballowfullscreen/g, 'allowFullScreen')
          // Fix self-closing tags that need to be self-closed in JSX
          .replace(/<(img|input|br|hr|meta|link)([^>]*?)(?<!\/)>/gi, '<$1$2 />')
          // Fix inline styles (basic conversion)
          .replace(/style="([^"]*)"/g, (match, styles) => {
            const jsxStyles = styles.split(';').filter(Boolean).map((s: string) => {
              const [prop, val] = s.split(':').map((x: string) => x.trim())
              if (!prop || !val) return ''
              // Convert kebab-case to camelCase
              const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())
              return `${camelProp}: "${val}"`
            }).filter(Boolean).join(', ')
            return `style={{${jsxStyles}}}`
          })
        
        return bodyContent
      }
      
      // Check if the code is a full HTML document (not inside a React component)
      if ((processedCode.includes('<html') || processedCode.includes('<!DOCTYPE') || processedCode.includes('<!doctype')) 
          && !processedCode.includes('function') && !processedCode.includes('=>')) {
        // Pure HTML document - extract body and wrap in React component
        const bodyContent = extractBodyContent(processedCode)
        if (bodyContent) {
          processedCode = `function App() {
  return (
    <div>
      ${bodyContent}
    </div>
  );
}`
        }
      }
      
      // CRITICAL FIX: Handle React component that returns <html> in JSX
      // Pattern: return ( <html ... ) or return (<html ...)
      if (processedCode.includes('return') && processedCode.match(/return\s*\(\s*<html/)) {
        // Extract the body content from within the return statement
        const bodyContent = extractBodyContent(processedCode)
        if (bodyContent) {
          // Extract any code before the return statement (useState, handlers, etc.)
          const beforeReturn = processedCode.match(/([\s\S]*?)return\s*\(/)?.[1] || ''
          
          // Clean up the beforeReturn - remove any broken syntax
          let cleanBeforeReturn = beforeReturn
            // Fix double const: const const = -> const handleSubmit =
            .replace(/const\s+const\s*=/g, 'const handleSubmit =')
            // Remove any incomplete lines
            .replace(/^\s*\n/gm, '')
          
          processedCode = `${cleanBeforeReturn}return (
    <div>
      ${bodyContent}
    </div>
  );
}`
        }
      }
      
      // Clean the code - comprehensive cleaning for preview
      let cleanCode = processedCode
      
      // CRITICAL FIX: Fix malformed className template literals
      // AI sometimes generates: className="{`w-5" h-5 ${...}`} instead of className={`w-5 h-5 ${...}`}
      // Step 1: Find all malformed className patterns with quote breaking the template
      cleanCode = cleanCode.replace(/className="\{`([^"]+)"\s+([^`]+)`\}/g, (match: string, part1: string, part2: string) => {
        return `className={\`${part1} ${part2}\`}`;
      })
      // Step 2: Handle simpler cases: className="{`class`}" -> className={`class`}
      cleanCode = cleanCode.replace(/className="\{`([^`]*)`\}"/g, 'className={`$1`}')
      // Step 3: Fix any remaining broken starts: className="{` -> className={`
      cleanCode = cleanCode.replace(/className="\{`/g, 'className={`')
      // Step 4: Fix any remaining broken ends: `}" -> `}
      cleanCode = cleanCode.replace(/`\}"/g, '`}')
      // Step 5: Fix cases where quote appears mid-className
      cleanCode = cleanCode.replace(/className="\{`([^"]+)"/g, 'className={`$1')
      
      cleanCode = cleanCode
        // CRITICAL FIX: Replace ALL Unicode arrow variants with ASCII arrow (=>)
        .replace(/⇒/g, "=>")  // U+21D2 Rightwards Double Arrow
        .replace(/→/g, "=>")  // U+2192 Rightwards Arrow
        .replace(/➔/g, "=>")  // U+2794 Heavy Wide-Headed Rightwards Arrow
        .replace(/➜/g, "=>")  // U+279C Heavy Round-Tipped Rightwards Arrow
        .replace(/➝/g, "=>")  // U+279D Drafting Point Rightwards Arrow
        .replace(/⟹/g, "=>")  // U+27F9 Long Rightwards Double Arrow
        .replace(/\u21D2/g, "=>")  // Explicit Unicode escape for ⇒
        .replace(/\u2192/g, "=>")  // Explicit Unicode escape for →
        // Remove directives
        .replace(/"use client"\s*/g, "")
        .replace(/'use client'\s*/g, "")
        .replace(/"use server"\s*/g, "")
        .replace(/'use server'\s*/g, "")
        // Remove all import statements
        .replace(/import\s+.*?from\s+["'].*?["'];?\s*/g, "")
        .replace(/import\s+{[^}]*}\s+from\s+["'].*?["'];?\s*/g, "")
        .replace(/import\s+["'].*?["'];?\s*/g, "")
        // Remove export type statements
        .replace(/export\s+type\s+.*?;/g, "")
        .trim()
      
      // Rename the component to App for consistency
      // Handle: export default function ComponentName (with or without TypeScript types)
      cleanCode = cleanCode.replace(
        /export\s+default\s+function\s+(\w+)\s*\(/,
        "function App("
      )
      // Also handle multi-line function signatures with TypeScript types
      cleanCode = cleanCode.replace(
        /export\s+default\s+function\s+(\w+)\s*\{/,
        "function App {"
      )
      
      // Handle: export default ComponentName (reference)
      cleanCode = cleanCode.replace(
        /export\s+default\s+(\w+)\s*;?\s*$/,
        "const App = $1;"
      )
      
      // Handle: const ComponentName = () => { ... } export default ComponentName
      const arrowMatch = cleanCode.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
      if (arrowMatch && !cleanCode.includes("function App") && !cleanCode.includes("const App =")) {
        const componentName = arrowMatch[1];
        cleanCode = cleanCode.replace(
          new RegExp(`const\\s+${componentName}\\s*=`),
          "const App ="
        );
        // Remove any remaining export default for this component
        cleanCode = cleanCode.replace(new RegExp(`export\\s+default\\s+${componentName}\\s*;?`), "");
      }
      
      // If there's still no App, try to find and rename any function component
      if (!cleanCode.includes("function App") && !cleanCode.includes("const App")) {
        const functionMatch = cleanCode.match(/function\s+(\w+)\s*\(/)
        if (functionMatch) {
          cleanCode = cleanCode.replace(
            new RegExp(`function\\s+${functionMatch[1]}\\s*\\(`),
            "function App("
          )
        }
      }
      
      // Fix common issues
      // Remove any leftover export statements
      cleanCode = cleanCode.replace(/export\s+{\s*\w+\s*(as\s+default)?\s*}\s*;?/g, "")
      cleanCode = cleanCode.replace(/export\s+default\s*;?/g, "")
      
      // Strip TypeScript type annotations comprehensively
      // Handle multi-line interface/type definitions first
      cleanCode = cleanCode.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
      cleanCode = cleanCode.replace(/type\s+\w+\s*=\s*\{[\s\S]*?\}/g, '')
      cleanCode = cleanCode.replace(/type\s+\w+\s*=\s*[^;\n]+;?/g, '')
      
      // Handle function parameter type annotations: ({ prop = 'value' }: { prop?: string }) -> ({ prop = 'value' })
      cleanCode = cleanCode.replace(/\}\s*:\s*\{[\s\S]*?\}\s*\)/g, '})')
      
      // Handle inline type annotations on variables
      cleanCode = cleanCode.replace(/:\s*(string|number|boolean|any|void|null|undefined|React\.\w+|[A-Z]\w*)(\[\])?\s*=/g, ' =')
      
      // Handle function return type annotations: function name(): Type { -> function name() {
      cleanCode = cleanCode.replace(/\)\s*:\s*[A-Za-z][\w<>\[\]|&\s]*\s*\{/g, ') {')
      cleanCode = cleanCode.replace(/\)\s*:\s*[A-Za-z][\w<>\[\]|&\s]*\s*=>/g, ') =>')
      
      // Handle arrow function parameter types: (param: Type) => -> (param) =>
      cleanCode = cleanCode.replace(/\(([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^)]+\)/g, '($1)')
      
      // Handle generic type parameters: <T extends Something> -> remove
      cleanCode = cleanCode.replace(/<[A-Z][\w\s,<>]*>/g, '')
      
      // Handle React.FC and similar type annotations
      cleanCode = cleanCode.replace(/:\s*React\.(FC|FunctionComponent|ComponentType)[<>\w\s,]*/g, '')
      
      // Clean up any double spaces or empty lines created
      cleanCode = cleanCode.replace(/\n\s*\n\s*\n/g, '\n\n')
      
      // Replace React.useState/useCallback/etc with just the hook name (already available)
      cleanCode = cleanCode.replace(/React\.(useState|useEffect|useCallback|useMemo|useRef|useReducer|useContext|createContext)/g, '$1')
      
      // Fix broken useState declarations (missing useState keyword)
      // Pattern: const [x, setX] =('value') -> const [x, setX] = useState('value')
      cleanCode = cleanCode.replace(/const\s+\[([^\]]+)\]\s*=\s*\((['"][^'"]*['"])\)/g, 'const [$1] = useState($2)')
      cleanCode = cleanCode.replace(/const\s+\[([^\]]+)\]\s*=\s*\(([^)]+)\)/g, 'const [$1] = useState($2)')
      
      // Fix missing variable name in destructuring: const [, setX] -> const [x, setX]
      cleanCode = cleanCode.replace(/const\s+\[\s*,\s*(set[A-Z]\w*)\]/g, (match: string, setter: string) => {
        const varName = setter.replace(/^set/, '').toLowerCase()
        return `const [${varName}, ${setter}]`
      })
      
      // CRITICAL FIX: Add missing 'const' before destructuring useState declarations
      // Pattern: [gameState, setGameState] = useState('menu') -> const [gameState, setGameState] = useState('menu')
      cleanCode = cleanCode.replace(
        /^(\s*)\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useState\(/gm,
        '$1const [$2, $3] = useState('
      )
      cleanCode = cleanCode.replace(
        /(\n\s+)\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useState\(/g,
        '$1const [$2, $3] = useState('
      )
      // Handle single variable useRef
      cleanCode = cleanCode.replace(
        /^(\s*)([a-zA-Z][a-zA-Z0-9]*)\s*=\s*useRef\(/gm,
        '$1const $2 = useRef('
      )
      cleanCode = cleanCode.replace(
        /(\n\s+)([a-zA-Z][a-zA-Z0-9]*)\s*=\s*useRef\(/g,
        '$1const $2 = useRef('
      )
      
      // Fix missing = in hook declarations
      cleanCode = cleanCode.replace(/\]\s+useState\(/g, '] = useState(')
      cleanCode = cleanCode.replace(/\]\s+useEffect\(/g, '] = useEffect(')
      cleanCode = cleanCode.replace(/\]\s+useCallback\(/g, '] = useCallback(')
      cleanCode = cleanCode.replace(/\]\s+useMemo\(/g, '] = useMemo(')
      
      // CRITICAL FIX: Fix missing brackets in useState destructuring
      // Pattern: const selectedPlan, setSelectedPlan = useState('basic') -> const [selectedPlan, setSelectedPlan] = useState('basic')
      cleanCode = cleanCode.replace(
        /const\s+([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\s*=\s*useState\(/g,
        'const [$1, $2] = useState('
      )
      
      // CRITICAL FIX: Fix malformed useState with missing closing bracket and wrong variable name
      // Pattern: const [Error, setPasswordError = useState(false); -> const [passwordError, setPasswordError] = useState(false);
      // Pattern: const [Error, setXxx = useState -> const [xxx, setXxx] = useState
      cleanCode = cleanCode.replace(
        /const\s+\[Error,\s*(set([A-Z][a-zA-Z0-9]*))\s*=\s*useState\(/g,
        (match, setter, varPart) => {
          const varName = varPart.charAt(0).toLowerCase() + varPart.slice(1)
          return `const [${varName}, ${setter}] = useState(`
        }
      )
      
      // CRITICAL FIX: Fix any useState with missing closing bracket
      // Pattern: const [xxx, setXxx = useState( -> const [xxx, setXxx] = useState(
      cleanCode = cleanCode.replace(
        /const\s+\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\s*=\s*useState\(/g,
        'const [$1, $2] = useState('
      )
      
      // CRITICAL FIX: Fix merged lines - when two useState declarations are on the same line
      cleanCode = cleanCode.replace(
        /useState\((['"][^'"]*['"])\)\s*const\s+\[/g,
        "useState($1);\n  const ["
      )
      cleanCode = cleanCode.replace(
        /useState\(([^)]+)\)\s*const\s+\[/g,
        "useState($1);\n  const ["
      )
      
      // CRITICAL FIX: Handle missing opening brace after function declaration
      // Pattern: function App()  const -> function App() { const
      cleanCode = cleanCode.replace(
        /function\s+(\w+)\s*\(\s*\)\s+(const|let|var|return|\/\/|\/\*)/g,
        'function $1() {\n  $2'
      )
      cleanCode = cleanCode.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s+(const|let|var|return|\/\/|\/\*)/g,
        'function $1($2) {\n  $3'
      )
      
      // CRITICAL FIX: Add missing 'const' keyword for arrow function declarations
      // Pattern: handleClick = () => { -> const handleClick = () => {
      cleanCode = cleanCode.replace(
        /^(\s*)([a-z][a-zA-Z0-9]*)\s*=\s*\(\s*\)\s*=>/gm,
        '$1const $2 = () =>'
      )
      cleanCode = cleanCode.replace(
        /^(\s*)([a-z][a-zA-Z0-9]*)\s*=\s*\(([^)]+)\)\s*=>/gm,
        '$1const $2 = ($3) =>'
      )
      cleanCode = cleanCode.replace(
        /(\n\s+)([a-z][a-zA-Z0-9]*)\s*=\s*\(\s*\)\s*=>/g,
        '$1const $2 = () =>'
      )
      cleanCode = cleanCode.replace(
        /(\n\s+)([a-z][a-zA-Z0-9]*)\s*=\s*\(([^)]+)\)\s*=>/g,
        '$1const $2 = ($3) =>'
      )
      
      // CRITICAL FIX: Fix missing comma in useState destructuring
      // Pattern: const [pricing setPricing] = useState -> const [pricing, setPricing] = useState
      cleanCode = cleanCode.replace(
        /const\s+\[([a-zA-Z][a-zA-Z0-9]*)\s+(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useState\(/g,
        'const [$1, $2] = useState('
      )
      
      // CRITICAL FIX: Fix missing object key before colon
      // Pattern: {: "value" -> { title: "value"
      cleanCode = cleanCode.replace(/\{:\s*"([^"]+)"/g, '{ title: "$1"')
      cleanCode = cleanCode.replace(/\{:\s*'([^']+)'/g, "{ title: '$1'")
      
      // CRITICAL FIX: Fix incomplete arithmetic in function calls
      // Pattern: count + ) -> count + 1)
      // Pattern: count - ) -> count - 1)
      cleanCode = cleanCode.replace(/(\w+)\s*\+\s*\)/g, '$1 + 1)')
      cleanCode = cleanCode.replace(/(\w+)\s*-\s*\)/g, '$1 - 1)')
      
      // CRITICAL FIX: Fix wrong setter function names (capitalization issues)
      // Pattern: Count(count + 1) -> setCount(count + 1) when there's a useState for count
      // First, find all useState declarations and their setters
      const useStateMatches = cleanCode.matchAll(/const\s+\[(\w+),\s*(set\w+)\]\s*=\s*useState/g)
      for (const match of useStateMatches) {
        const varName = match[1]
        const setterName = match[2]
        // Fix capitalized version without 'set' prefix: Count( -> setCount(
        const wrongName = varName.charAt(0).toUpperCase() + varName.slice(1)
        const wrongPattern = new RegExp(`(?<!set)${wrongName}\\(`, 'g')
        cleanCode = cleanCode.replace(wrongPattern, `${setterName}(`)
      }
      
      // CRITICAL FIX: Fix malformed arrow function syntax
      // Pattern: =(() => { -> = () => {
      cleanCode = cleanCode.replace(/=\s*\(\s*\(\s*\)\s*=>/g, '= () =>')
      
      // CRITICAL FIX: Fix useCallback with wrong syntax
      // Pattern: const handleClick =(()  => { ... }, []); -> const handleClick = useCallback(() => { ... }, []);
      cleanCode = cleanCode.replace(/const\s+(\w+)\s*=\s*\(\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*,\s*\[\s*\]\s*\)/g, 
        'const $1 = useCallback(() => {$2}, [])')
      
      // CRITICAL FIX: Fix incomplete useState values
      // Pattern: useState( ) -> useState(0) or useState('')
      cleanCode = cleanCode.replace(/useState\(\s*\)/g, "useState('')")
      
      // CRITICAL FIX: Fix useState with missing opening parenthesis
      // Pattern: useState); -> useState(false);
      cleanCode = cleanCode.replace(/useState\s*\)\s*;/g, "useState(false);")
      
      // CRITICAL FIX: Fix useState with only closing parenthesis
      // Pattern: = useState); -> = useState(false);
      cleanCode = cleanCode.replace(/=\s*useState\s*\)/g, "= useState(false)")
      
      // CRITICAL FIX: Fix setter calls without 'set' prefix
      // Pattern: CTAClicked(true) when there's setIsCTAClicked -> setIsCTAClicked(true)
      // Find all useState with 'is' prefix and fix wrong setter calls
      const isStateMatches = cleanCode.matchAll(/const\s+\[(is\w+),\s*(setIs\w+)\]\s*=\s*useState/g)
      for (const match of isStateMatches) {
        const varName = match[1] // e.g., isCTAClicked
        const setterName = match[2] // e.g., setIsCTAClicked
        // The wrong pattern would be just the part after 'is' capitalized: CTAClicked(
        const wrongName = varName.slice(2) // Remove 'is' prefix -> CTAClicked
        const wrongPattern = new RegExp(`(?<![a-zA-Z])${wrongName}\\(`, 'g')
        cleanCode = cleanCode.replace(wrongPattern, `${setterName}(`)
      }
      
      // CRITICAL FIX: Fix incomplete setter calls
      // Pattern: setCount(count + ); -> setCount(count + 1);
      cleanCode = cleanCode.replace(/(set\w+)\((\w+)\s*\+\s*\)/g, '$1($2 + 1)')
      cleanCode = cleanCode.replace(/(set\w+)\((\w+)\s*-\s*\)/g, '$1($2 - 1)')
      
      // CRITICAL FIX: Fix missing semicolons after useState
      cleanCode = cleanCode.replace(/useState\(([^)]+)\)\s*\n/g, "useState($1);\n")
      
      // CRITICAL FIX: Fix broken JSX self-closing tags
      // Pattern: <Component / > -> <Component />
      cleanCode = cleanCode.replace(/<(\w+)([^>]*)\s+\/\s+>/g, '<$1$2 />')
      
      // CRITICAL FIX: Expose App to window for Babel transpiled code
      // Babel standalone wraps code in a function scope, so we need to explicitly expose App
      if (cleanCode.includes('function App') || cleanCode.includes('const App')) {
        cleanCode += '\n\n// Expose App to window for rendering\nwindow.App = App;'
      }
      
      const html = generatePreviewHTML(cleanCode)
      
      // Use srcdoc for more reliable inline HTML rendering
      // This avoids blob URL issues with sandbox restrictions
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html
      }
      
      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
      }
    } catch (err) {
      setPreviewLoading(false)
      setError(err instanceof Error ? err.message : "Failed to render preview")
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [code, generatePreviewHTML])

  // Listen for preview loaded message from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-loaded') {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
        setPreviewLoading(false)
      } else if (event.data?.type === 'preview-error') {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
        setPreviewLoading(false)
        setError(event.data.error || 'Preview error occurred')
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/typescript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `component-${Date.now()}.tsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Code downloaded!")
  }

  const openInNewTab = () => {
    if (!code) return
    
    let cleanCode = code
      .replace(/"use client"\s*/g, "")
      .replace(/import\s+.*?from\s+["'].*?["'];?\s*/g, "")
      .trim()
      .replace(/export\s+default\s+function\s+(\w+)/, "function App")
    
    if (!cleanCode.includes("export default")) {
      cleanCode += "\n\nexport default App;"
    }
    
    const html = generatePreviewHTML(cleanCode)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const refreshPreview = () => {
    if (iframeRef.current) {
      setError(null)
      setPreviewLoading(true)
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src
    }
  }

  // DEBUG: Check if component renders at all
  console.log('LivePreview rendering, code length:', code?.length || 0, 'isLoading:', isLoading, 'showCode:', showCode);
  console.log('Code first 100 chars:', code?.substring(0, 100));
  
  return (
    <div ref={containerRef} className={cn("flex flex-col h-full bg-slate-900", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-1">
          {/* View Toggle */}
          <Button
            variant={showCode ? "ghost" : "secondary"}
            size="sm"
            onClick={() => setShowCode(false)}
            className={cn(!showCode && "bg-secondary")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant={showCode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowCode(true)}
            className={cn(showCode && "bg-secondary")}
          >
            <Code className="h-4 w-4 mr-1" />
            Code
          </Button>
        </div>

        {/* Viewport Selector */}
        {!showCode && (
          <div className="flex items-center gap-1 px-2 border-x border-border">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewport === "mobile" && "bg-secondary")}
              onClick={() => setViewport("mobile")}
              title="Mobile"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewport === "tablet" && "bg-secondary")}
              onClick={() => setViewport("tablet")}
              title="Tablet"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", viewport === "desktop" && "bg-secondary")}
              onClick={() => setViewport("desktop")}
              title="Desktop"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode} title="Copy code">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={downloadCode} title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openInNewTab} title="Open in new tab">
            <ExternalLink className="h-4 w-4" />
          </Button>
          {!showCode && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshPreview} title="Refresh">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title="Fullscreen">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-muted/20">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground">Generating your creation...</p>
            </div>
          </div>
        ) : showCode ? (
          <div className="h-full overflow-auto p-4">
            <pre className="text-sm font-mono text-foreground whitespace-pre-wrap bg-background rounded-lg p-4 border border-border">
              {code || "// Your generated code will appear here"}
            </pre>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full p-4">
            <Card className="p-6 max-w-md bg-destructive/10 border-destructive/20">
              <h3 className="font-semibold text-destructive mb-2">Preview Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="bg-transparent" onClick={refreshPreview}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent" onClick={() => setShowCode(true)}>
                  View Code
                </Button>
              </div>
            </Card>
          </div>
        ) : code ? (
          <div 
            className="h-full flex items-start justify-center p-4 overflow-auto"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 relative"
              style={{ 
                width: VIEWPORT_SIZES[viewport].width,
                height: viewport === "full" ? "100%" : "auto",
                minHeight: viewport === "full" ? "100%" : "600px",
                maxHeight: viewport === "full" ? "none" : "800px"
              }}
            >
              {previewLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading preview...</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                style={{ minHeight: "600px" }}
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                title="Preview"
                onLoad={() => {
                  if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current)
                  }
                  setPreviewLoading(false)
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Monitor className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Enter a prompt to generate your creation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
