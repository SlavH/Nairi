/**
 * Analytics tracking for Nairi
 * Supports multiple analytics providers
 */

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void
  identify(userId: string, traits?: Record<string, any>): void
  page(name: string, properties?: Record<string, any>): void
}

// Google Analytics 4
class GoogleAnalytics implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('event', event.name, {
      ...event.properties,
      user_id: event.userId,
    })
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      user_id: userId,
      ...traits,
    })
  }

  page(name: string, properties?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('event', 'page_view', {
      page_title: name,
      ...properties,
    })
  }
}

// Mixpanel
class MixpanelAnalytics implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    if (typeof window === 'undefined' || !window.mixpanel) return

    window.mixpanel.track(event.name, event.properties)
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.mixpanel) return

    window.mixpanel.identify(userId)
    if (traits) {
      window.mixpanel.people.set(traits)
    }
  }

  page(name: string, properties?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.mixpanel) return

    window.mixpanel.track('Page View', {
      page: name,
      ...properties,
    })
  }
}

// Plausible Analytics (privacy-focused)
class PlausibleAnalytics implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    if (typeof window === 'undefined' || !window.plausible) return

    window.plausible(event.name, { props: event.properties })
  }

  identify(userId: string, traits?: Record<string, any>): void {
    // Plausible doesn't support user identification (privacy-focused)
    // Store in session storage for custom events
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_user_id', userId)
    }
  }

  page(name: string, properties?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.plausible) return

    window.plausible('pageview', { props: { page: name, ...properties } })
  }
}

// Analytics Manager
class AnalyticsManager {
  private providers: AnalyticsProvider[] = []
  private enabled = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = this.checkConsent()
      this.initializeProviders()
    }
  }

  private checkConsent(): boolean {
    // Check if user has consented to analytics
    if (typeof window === 'undefined') return false
    
    const consent = localStorage.getItem('analytics_consent')
    return consent === 'true'
  }

  private initializeProviders(): void {
    // Initialize based on environment variables
    if (process.env.NEXT_PUBLIC_GA_ID) {
      this.providers.push(new GoogleAnalytics())
    }
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      this.providers.push(new MixpanelAnalytics())
    }
    if (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
      this.providers.push(new PlausibleAnalytics())
    }
  }

  setConsent(consent: boolean): void {
    this.enabled = consent
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', consent.toString())
    }
    
    if (consent) {
      this.initializeProviders()
    } else {
      this.providers = []
    }
  }

  track(eventName: string, properties?: Record<string, any>, userId?: string): void {
    if (!this.enabled) return

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      userId,
      timestamp: new Date(),
    }

    this.providers.forEach(provider => {
      try {
        provider.track(event)
      } catch (error) {
        console.error('Analytics tracking error:', error)
      }
    })
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled) return

    this.providers.forEach(provider => {
      try {
        provider.identify(userId, traits)
      } catch (error) {
        console.error('Analytics identify error:', error)
      }
    })
  }

  page(name: string, properties?: Record<string, any>): void {
    if (!this.enabled) return

    this.providers.forEach(provider => {
      try {
        provider.page(name, properties)
      } catch (error) {
        console.error('Analytics page error:', error)
      }
    })
  }
}

// Singleton instance
export const analytics = new AnalyticsManager()

// Predefined event types
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Chat events
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED: 'chat_response_received',
  CHAT_ERROR: 'chat_error',
  CHAT_CONVERSATION_STARTED: 'chat_conversation_started',
  
  // Builder events
  BUILDER_PROJECT_CREATED: 'builder_project_created',
  BUILDER_COMPONENT_GENERATED: 'builder_component_generated',
  BUILDER_CODE_EXPORTED: 'builder_code_exported',
  BUILDER_PREVIEW_OPENED: 'builder_preview_opened',
  
  // Marketplace events
  MARKETPLACE_TEMPLATE_VIEWED: 'marketplace_template_viewed',
  MARKETPLACE_TEMPLATE_USED: 'marketplace_template_used',
  MARKETPLACE_SEARCH: 'marketplace_search',
  
  // Performance events
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  ERROR_OCCURRED: 'error_occurred',
} as const

// Type-safe event tracking helpers
export const trackEvent = {
  userSignedUp: (userId: string, method: string) => {
    analytics.track(AnalyticsEvents.USER_SIGNED_UP, { method }, userId)
  },
  
  userSignedIn: (userId: string, method: string) => {
    analytics.track(AnalyticsEvents.USER_SIGNED_IN, { method }, userId)
  },
  
  chatMessageSent: (userId: string, messageLength: number, model: string) => {
    analytics.track(AnalyticsEvents.CHAT_MESSAGE_SENT, {
      message_length: messageLength,
      model,
    }, userId)
  },
  
  builderProjectCreated: (userId: string, projectType: string) => {
    analytics.track(AnalyticsEvents.BUILDER_PROJECT_CREATED, {
      project_type: projectType,
    }, userId)
  },
  
  pageLoadTime: (page: string, loadTime: number) => {
    analytics.track(AnalyticsEvents.PAGE_LOAD_TIME, {
      page,
      load_time_ms: loadTime,
    })
  },
  
  errorOccurred: (error: string, context: string) => {
    analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
      error,
      context,
    })
  },
}

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
    page: analytics.page.bind(analytics),
    setConsent: analytics.setConsent.bind(analytics),
    trackEvent,
  }
}

// Type declarations for window
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    mixpanel?: any
    plausible?: (...args: any[]) => void
  }
}
