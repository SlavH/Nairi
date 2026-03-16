/**
 * SEO Configuration for Nairi AI
 * Centralized metadata for all pages
 */

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  canonical?: string
  noindex?: boolean
}

const baseUrl = 'https://nairi.ai'
const defaultOgImage = `${baseUrl}/og-image.png`

export const defaultSEO: SEOConfig = {
  title: 'Nairi AI - Advanced AI Assistant & Code Generator',
  description: 'Build applications faster with Nairi AI. Generate code, create designs, and automate workflows with our advanced AI assistant.',
  keywords: ['AI assistant', 'code generator', 'AI development', 'automation', 'no-code', 'low-code'],
  ogImage: defaultOgImage,
  ogType: 'website',
  twitterCard: 'summary_large_image',
}

export const pageSEO: Record<string, SEOConfig> = {
  home: {
    title: 'Nairi AI - Advanced AI Assistant & Code Generator',
    description: 'Transform your ideas into reality with Nairi AI. Generate code, create designs, and automate workflows using cutting-edge AI technology.',
    keywords: ['AI assistant', 'code generator', 'AI development', 'automation', 'GPT-4', 'Claude'],
    ogImage: `${baseUrl}/og-home.png`,
  },
  
  chat: {
    title: 'AI Chat - Nairi AI',
    description: 'Chat with advanced AI models including GPT-4, Claude, and more. Get instant answers, code help, and creative assistance.',
    keywords: ['AI chat', 'GPT-4', 'Claude', 'AI conversation', 'chatbot'],
    ogImage: `${baseUrl}/og-chat.png`,
  },
  
  builder: {
    title: 'AI Code Builder - Nairi AI',
    description: 'Generate production-ready code from natural language. Build React components, APIs, and full applications with AI.',
    keywords: ['code generator', 'AI builder', 'React generator', 'component builder', 'AI development'],
    ogImage: `${baseUrl}/og-builder.png`,
  },
  
  marketplace: {
    title: 'Marketplace - Nairi AI',
    description: 'Discover premium templates, plugins, and tools for Nairi AI. Enhance your workflow with community-created resources.',
    keywords: ['AI marketplace', 'templates', 'plugins', 'AI tools', 'components'],
    ogImage: `${baseUrl}/og-marketplace.png`,
  },
  
  pricing: {
    title: 'Pricing - Nairi AI',
    description: 'Choose the perfect plan for your needs. From free tier to enterprise solutions with custom AI models and dedicated support.',
    keywords: ['pricing', 'plans', 'subscription', 'AI pricing', 'enterprise AI'],
    ogImage: `${baseUrl}/og-pricing.png`,
  },
  
  docs: {
    title: 'Documentation - Nairi AI',
    description: 'Complete documentation for Nairi AI. Learn how to use our API, integrate AI into your workflow, and build amazing applications.',
    keywords: ['documentation', 'API docs', 'guides', 'tutorials', 'AI documentation'],
    ogImage: `${baseUrl}/og-docs.png`,
  },
  
  about: {
    title: 'About Us - Nairi AI',
    description: 'Learn about Nairi AI, our mission to democratize AI development, and the team building the future of AI-powered creation.',
    keywords: ['about', 'company', 'mission', 'team', 'AI company'],
    ogImage: `${baseUrl}/og-about.png`,
  },
  
  contact: {
    title: 'Contact Us - Nairi AI',
    description: 'Get in touch with the Nairi AI team. We\'re here to help with questions, support, and partnership opportunities.',
    keywords: ['contact', 'support', 'help', 'customer service'],
    ogImage: defaultOgImage,
  },
}

/**
 * Generate metadata for Next.js pages
 */
export function generateMetadata(page: keyof typeof pageSEO | SEOConfig): any {
  const config = typeof page === 'string' ? (pageSEO[page] || defaultSEO) : page
  
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', '),
    openGraph: {
      title: config.title,
      description: config.description,
      type: config.ogType || 'website',
      url: config.canonical || baseUrl,
      images: [
        {
          url: config.ogImage || defaultOgImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      siteName: 'Nairi AI',
    },
    twitter: {
      card: config.twitterCard || 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [config.ogImage || defaultOgImage],
      creator: '@NairiAI',
      site: '@NairiAI',
    },
    robots: {
      index: !config.noindex,
      follow: !config.noindex,
      googleBot: {
        index: !config.noindex,
        follow: !config.noindex,
      },
    },
    alternates: {
      canonical: config.canonical,
    },
  }
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(type: 'Organization' | 'WebSite' | 'Product' | 'Article', data?: any) {
  const baseData = {
    '@context': 'https://schema.org',
  }
  
  switch (type) {
    case 'Organization':
      return {
        ...baseData,
        '@type': 'Organization',
        name: 'Nairi AI',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description: defaultSEO.description,
        sameAs: [
          'https://twitter.com/NairiAI',
          'https://github.com/nairi-ai',
          'https://linkedin.com/company/nairi-ai',
        ],
        ...data,
      }
    
    case 'WebSite':
      return {
        ...baseData,
        '@type': 'WebSite',
        name: 'Nairi AI',
        url: baseUrl,
        description: defaultSEO.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        ...data,
      }
    
    case 'Product':
      return {
        ...baseData,
        '@type': 'SoftwareApplication',
        name: 'Nairi AI',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
        },
        ...data,
      }
    
    case 'Article':
      return {
        ...baseData,
        '@type': 'Article',
        publisher: {
          '@type': 'Organization',
          name: 'Nairi AI',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
          },
        },
        ...data,
      }
    
    default:
      return baseData
  }
}
