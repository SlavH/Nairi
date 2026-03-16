'use client'

/**
 * Device Fingerprint Collector Component
 * 
 * Collects browser characteristics to generate a unique device fingerprint.
 * This runs on the client side and sends the fingerprint to the server
 * during signup to detect multi-account abuse.
 */

import { useEffect, useState } from 'react'
import type { DeviceFingerprint } from '@/lib/device-fingerprint'

interface FingerprintCollectorProps {
  onFingerprintCollected: (fingerprint: string) => void
}

export function FingerprintCollector({ onFingerprintCollected }: FingerprintCollectorProps) {
  const [isCollecting, setIsCollecting] = useState(true)

  useEffect(() => {
    collectFingerprint()
  }, [])

  async function collectFingerprint() {
    try {
      const fingerprint: DeviceFingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth
        },
        canvas: await getCanvasFingerprint(),
        webgl: await getWebGLFingerprint(),
        fonts: await getAvailableFonts(),
        plugins: getPlugins(),
        audio: await getAudioFingerprint()
      }

      // Hash the fingerprint
      const hash = hashFingerprint(fingerprint)
      onFingerprintCollected(hash)
      setIsCollecting(false)
    } catch (error) {
      console.error('Error collecting fingerprint:', error)
      // Send a fallback fingerprint based on user agent
      const fallbackHash = hashString(navigator.userAgent + Date.now())
      onFingerprintCollected(fallbackHash)
      setIsCollecting(false)
    }
  }

  function hashFingerprint(fingerprint: DeviceFingerprint): string {
    const str = JSON.stringify(fingerprint)
    return hashString(str)
  }

  function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  async function getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'no-canvas'

      canvas.width = 200
      canvas.height = 50

      // Draw text with various styles
      ctx.textBaseline = 'top'
      ctx.font = '14px "Arial"'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Nairi Fingerprint 🔒', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Nairi Fingerprint 🔒', 4, 17)

      // Get canvas data
      return canvas.toDataURL()
    } catch (error) {
      return 'canvas-error'
    }
  }

  async function getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) return 'no-webgl'

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info')
      if (!debugInfo) return 'no-debug-info'

      const webglContext = gl as WebGLRenderingContext
      const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)

      return `${vendor}~${renderer}`
    } catch (error) {
      return 'webgl-error'
    }
  }

  async function getAvailableFonts(): Promise<string[]> {
    const baseFonts = ['monospace', 'sans-serif', 'serif']
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
      'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
      'Impact', 'Lucida Console', 'Tahoma', 'Helvetica', 'Calibri'
    ]

    const availableFonts: string[] = []
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return []

    const testString = 'mmmmmmmmmmlli'
    const testSize = '72px'

    // Get baseline measurements
    const baselines: Record<string, number> = {}
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} ${baseFont}`
      baselines[baseFont] = ctx.measureText(testString).width
    }

    // Test each font
    for (const testFont of testFonts) {
      let detected = false
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} '${testFont}', ${baseFont}`
        const width = ctx.measureText(testString).width
        if (width !== baselines[baseFont]) {
          detected = true
          break
        }
      }
      if (detected) {
        availableFonts.push(testFont)
      }
    }

    return availableFonts
  }

  function getPlugins(): string[] {
    const plugins: string[] = []
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i]
      if (plugin && plugin.name) {
        plugins.push(plugin.name)
      }
    }
    return plugins
  }

  async function getAudioFingerprint(): Promise<string> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return 'no-audio-context'

      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const analyser = context.createAnalyser()
      const gainNode = context.createGain()
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1)

      gainNode.gain.value = 0 // Mute
      oscillator.type = 'triangle'
      oscillator.connect(analyser)
      analyser.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start(0)

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = function(event) {
          const output = event.outputBuffer.getChannelData(0)
          const hash = Array.from(output.slice(0, 30))
            .map(v => v.toFixed(6))
            .join(',')
          
          oscillator.stop()
          scriptProcessor.disconnect()
          gainNode.disconnect()
          analyser.disconnect()
          oscillator.disconnect()
          context.close()
          
          resolve(hash)
        }
      })
    } catch (error) {
      return 'audio-error'
    }
  }

  // This component doesn't render anything visible
  return null
}
