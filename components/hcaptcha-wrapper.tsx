"use client"

import { useEffect, useRef, useCallback } from 'react'

interface HCaptchaProps {
  sitekey: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

declare global {
  interface Window {
    hcaptcha: any
  }
}

export function HCaptcha({ sitekey, onVerify, onError, onExpire }: HCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const scriptLoadedRef = useRef<boolean>(false)
  const onVerifyRef = useRef(onVerify)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onVerifyRef.current = onVerify
    onErrorRef.current = onError
    onExpireRef.current = onExpire
  }, [onVerify, onError, onExpire])

  useEffect(() => {
    // Prevent multiple script loads
    if (scriptLoadedRef.current) return
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://js.hcaptcha.com/1/api.js"]')
    if (existingScript) {
      // Script already loaded, just render the widget
      if (containerRef.current && window.hcaptcha && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey,
            callback: (token: string) => onVerifyRef.current(token),
            'error-callback': () => onErrorRef.current?.(),
            'expired-callback': () => onExpireRef.current?.(),
          })
        } catch (e) {
          // Widget may already be rendered, ignore error
          console.warn('hCaptcha render warning:', e)
        }
      }
      scriptLoadedRef.current = true
      return
    }

    // Load hCaptcha script
    const script = document.createElement('script')
    script.src = 'https://js.hcaptcha.com/1/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (containerRef.current && window.hcaptcha && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey,
            callback: (token: string) => onVerifyRef.current(token),
            'error-callback': () => onErrorRef.current?.(),
            'expired-callback': () => onExpireRef.current?.(),
          })
        } catch (e) {
          console.warn('hCaptcha render warning:', e)
        }
      }
    }

    scriptLoadedRef.current = true

    return () => {
      if (widgetIdRef.current && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetIdRef.current)
        } catch (e) {
          // Ignore removal errors
        }
        widgetIdRef.current = null
      }
      // Don't remove script as it may be used by other components
    }
  }, [sitekey]) // Only depend on sitekey, not callbacks

  return <div ref={containerRef} className="flex justify-center my-4" />
}
