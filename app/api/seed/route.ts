import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Sample feed posts data
const sampleFeedPosts = [
  {
    content: '🚀 Just built my first AI-powered web app using Nairi! The code generation feature saved me hours of work. #AI #WebDev',
    post_type: 'text',
    visibility: 'public',
    likes_count: 42,
    comments_count: 8,
    shares_count: 5,
  },
  {
    content: '📊 Data Science Tip: Always visualize your data before modeling. Here\'s why it matters and how to do it effectively...',
    post_type: 'text',
    visibility: 'public',
    likes_count: 89,
    comments_count: 15,
    shares_count: 12,
  },
  {
    content: '💡 Quick Python trick: Use list comprehensions for cleaner, faster code. Example: [x**2 for x in range(10)]',
    post_type: 'text',
    visibility: 'public',
    likes_count: 127,
    comments_count: 23,
    shares_count: 18,
  },
  {
    content: '🎨 Design principle of the day: White space is not wasted space. It improves readability and creates visual hierarchy.',
    post_type: 'text',
    visibility: 'public',
    likes_count: 64,
    comments_count: 12,
    shares_count: 8,
  },
  {
    content: '🧠 Learning AI doesn\'t require a PhD! Start with these free resources and build projects. Sharing my journey...',
    post_type: 'text',
    visibility: 'public',
    likes_count: 156,
    comments_count: 34,
    shares_count: 25,
  },
  {
    content: '⚡ Just discovered that Nairi can generate interactive simulations! Created a physics demo in seconds. Mind blown! 🤯',
    post_type: 'text',
    visibility: 'public',
    likes_count: 203,
    comments_count: 45,
    shares_count: 32,
  },
  {
    content: '🔥 Hot take: The best code is the code you don\'t have to write. AI-assisted development is the future.',
    post_type: 'text',
    visibility: 'public',
    likes_count: 178,
    comments_count: 56,
    shares_count: 28,
  },
]

// Sample courses data
const sampleCourses = [
  {
    title: 'Introduction to AI & Machine Learning',
    description: 'Learn the fundamentals of artificial intelligence and machine learning. Perfect for beginners with no prior experience.',
    category: 'Technology',
    difficulty: 'beginner',
    thumbnail_url: 'https://image.pollinations.ai/prompt/AI%20machine%20learning%20course%20thumbnail?width=400&height=300&nologo=true',
    is_published: true,
    duration_minutes: 480,
  },
  {
    title: 'Web Development Bootcamp',
    description: 'Complete web development course covering HTML, CSS, JavaScript, React, and Node.js. Build real-world projects.',
    category: 'Technology',
    difficulty: 'intermediate',
    thumbnail_url: 'https://image.pollinations.ai/prompt/web%20development%20coding%20bootcamp?width=400&height=300&nologo=true',
    is_published: true,
    duration_minutes: 2400,
  },
  {
    title: 'Data Science Fundamentals',
    description: 'Master data analysis, visualization, and statistical methods. Learn Python, pandas, and data storytelling.',
    category: 'Data Science',
    difficulty: 'intermediate',
    thumbnail_url: 'https://image.pollinations.ai/prompt/data%20science%20analytics%20visualization?width=400&height=300&nologo=true',
    is_published: true,
    duration_minutes: 1500,
  },
  {
    title: 'Creative Writing Masterclass',
    description: 'Develop your writing skills with techniques from professional authors. Fiction, non-fiction, and storytelling.',
    category: 'Arts & Humanities',
    difficulty: 'beginner',
    thumbnail_url: 'https://image.pollinations.ai/prompt/creative%20writing%20storytelling%20books?width=400&height=300&nologo=true',
    is_published: true,
    duration_minutes: 720,
  },
  {
    title: 'Python Programming for Beginners',
    description: 'Start your programming journey with Python. Learn syntax, data structures, and build practical projects.',
    category: 'Technology',
    difficulty: 'beginner',
    thumbnail_url: 'https://image.pollinations.ai/prompt/python%20programming%20code%20beginner?width=400&height=300&nologo=true',
    is_published: true,
    duration_minutes: 1200,
  },
  {
    title: 'UI/UX Design Principles',
    description: 'Master user interface and user experience design. Learn Figma, design thinking, and prototyping.',
    category: 'Design',
    difficulty: 'intermediate',
    thumbnail_url: 'https://image.pollinations.ai/prompt/UI%20UX%20design%20interface%20user%20experience?width=400&height=300&nologo=true',
    is_published: true,
    duration_minutes: 1080,
  },
]

// Sample agents data
const sampleAgents = [
  {
    name: 'Research Assistant',
    description: 'Deep research and analysis agent for any topic. Searches the web, analyzes data, and generates comprehensive reports.',
    category: 'Research',
    capabilities: ['Web Search', 'Data Analysis', 'Report Generation', 'Citation Management'],
    price_credits: 0,
    is_premium: false,
    rating: 4.8,
    usage_count: 15420,
    system_prompt: 'You are a research assistant specialized in deep analysis and comprehensive reporting.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.3 },
    is_published: true,
  },
  {
    name: 'Code Helper',
    description: 'Expert coding assistant for any programming language. Reviews code, fixes bugs, and optimizes performance.',
    category: 'Development',
    capabilities: ['Code Review', 'Bug Fixing', 'Optimization', 'Documentation'],
    price_credits: 0,
    is_premium: false,
    rating: 4.9,
    usage_count: 28350,
    system_prompt: 'You are an expert software engineer who helps with code review, debugging, and optimization.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.2 },
    is_published: true,
  },
  {
    name: 'Writing Pro',
    description: 'Professional writing and editing assistant. Creates engaging content, edits for clarity, and optimizes for SEO.',
    category: 'Content',
    capabilities: ['Content Writing', 'Editing', 'SEO Optimization', 'Proofreading'],
    price_credits: 0,
    is_premium: false,
    rating: 4.7,
    usage_count: 12890,
    system_prompt: 'You are a professional writer and editor who creates engaging, clear, and SEO-optimized content.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.7 },
    is_published: true,
  },
  {
    name: 'Data Analyst',
    description: 'Advanced data processing and visualization expert. Analyzes datasets, creates visualizations, and extracts insights.',
    category: 'Analytics',
    capabilities: ['Data Processing', 'Visualization', 'Statistical Analysis', 'Insights'],
    price_credits: 0,
    is_premium: false,
    rating: 4.6,
    usage_count: 8920,
    system_prompt: 'You are a data analyst who processes data, creates visualizations, and extracts actionable insights.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.3 },
    is_published: true,
  },
  {
    name: 'Math Tutor',
    description: 'Expert mathematics tutor for all levels. Explains concepts clearly, solves problems step-by-step, and provides practice.',
    category: 'Education',
    capabilities: ['Problem Solving', 'Step-by-Step Explanations', 'Practice Problems', 'Concept Clarification'],
    price_credits: 0,
    is_premium: false,
    rating: 4.9,
    usage_count: 22150,
    system_prompt: 'You are a patient and knowledgeable math tutor who explains concepts clearly and helps students understand.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.4 },
    is_published: true,
  },
  {
    name: 'Language Teacher',
    description: 'Multilingual language learning assistant. Teaches vocabulary, grammar, pronunciation, and cultural context.',
    category: 'Education',
    capabilities: ['Vocabulary', 'Grammar', 'Pronunciation', 'Cultural Context', 'Conversation Practice'],
    price_credits: 0,
    is_premium: false,
    rating: 4.8,
    usage_count: 18760,
    system_prompt: 'You are a multilingual language teacher who helps students learn new languages effectively.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.6 },
    is_published: true,
  },
  {
    name: 'Creative Designer',
    description: 'AI design assistant for graphics, UI/UX, and branding. Provides design feedback and generates creative ideas.',
    category: 'Design',
    capabilities: ['Design Feedback', 'UI/UX Guidance', 'Branding', 'Color Theory', 'Layout'],
    price_credits: 0,
    is_premium: false,
    rating: 4.7,
    usage_count: 9840,
    system_prompt: 'You are a creative designer who provides expert guidance on graphics, UI/UX, and branding.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.8 },
    is_published: true,
  },
  {
    name: 'Customer Support',
    description: 'AI-powered customer service agent. Handles inquiries 24/7, manages tickets, and provides multilingual support.',
    category: 'Support',
    capabilities: ['24/7 Support', 'Multi-language', 'Ticket Management', 'FAQ'],
    price_credits: 0,
    is_premium: false,
    rating: 4.8,
    usage_count: 19230,
    system_prompt: 'You are a customer support specialist who provides helpful, empathetic, and efficient assistance.',
    model_config: { model: 'llama-3.1-70b-versatile', temperature: 0.5 },
    is_published: true,
  },
]

// Sample knowledge nodes
const sampleKnowledgeNodes = [
  {
    title: 'Machine Learning Basics',
    content: 'Machine learning is a subset of AI that enables systems to learn from data without being explicitly programmed.',
    node_type: 'concept',
    confidence_score: 0.9,
    source: 'AI Fundamentals Course',
    tags: ['AI', 'ML', 'Data Science'],
  },
  {
    title: 'Neural Networks',
    content: 'Neural networks are computing systems inspired by biological neural networks that constitute animal brains.',
    node_type: 'concept',
    confidence_score: 0.85,
    source: 'Deep Learning Guide',
    tags: ['AI', 'Deep Learning', 'Neural Networks'],
  },
  {
    title: 'Python is Great for AI',
    content: 'Python is the most popular programming language for AI and machine learning due to its simplicity and rich ecosystem.',
    node_type: 'fact',
    confidence_score: 0.95,
    source: 'Programming Survey 2025',
    tags: ['Python', 'Programming', 'AI'],
  },
]

// Sample marketplace creations (text, websites, templates, etc.)
const sampleCreations = [
  {
    title: 'Viral LinkedIn Post Prompts',
    description: '10 proven prompt templates for high-engagement LinkedIn posts. Copy-paste and customize for your niche.',
    product_type: 'prompt' as const,
    price_cents: 0,
    category: 'Content',
    tags: ['writing', 'social', 'linkedin'],
    preview_content: '1. The curiosity hook: "Nobody talks about this..."\n2. The number list: "7 things I wish I knew..."',
    full_content: 'Full set of 10 prompts with examples and best practices.',
    is_published: true,
    purchase_count: 420,
    rating: 4.7,
  },
  {
    title: 'SaaS Landing Page (React + Tailwind)',
    description: 'Production-ready landing page component with hero, features, pricing, and CTA. Responsive and dark-mode ready.',
    product_type: 'code' as const,
    price_cents: 990,
    category: 'Development',
    tags: ['react', 'tailwind', 'landing'],
    preview_content: 'Single-page React component. Uses Tailwind, Framer Motion optional. Sections: Hero, Features, Pricing, Footer.',
    is_published: true,
    purchase_count: 156,
    rating: 4.9,
  },
  {
    title: 'Blog Post Outline Template',
    description: 'Structured outline template for SEO-friendly long-form blog posts. Includes intro, H2/H3 hierarchy, and CTA.',
    product_type: 'template' as const,
    price_cents: 0,
    category: 'Content',
    tags: ['blog', 'seo', 'writing'],
    preview_content: '1. Hook + promise (1–2 sentences)\n2. Key takeaway (bullet)\n3. Section 1...',
    is_published: true,
    purchase_count: 890,
    rating: 4.6,
  },
  {
    title: 'API Request/Response Logger',
    description: 'Lightweight browser tool to log and inspect API requests and responses. Export as JSON or cURL.',
    product_type: 'tool' as const,
    price_cents: 499,
    category: 'Development',
    tags: ['api', 'debug', 'devtools'],
    preview_content: 'Drop-in script or bookmarklet. Captures fetch/XHR, shows headers and body.',
    is_published: true,
    purchase_count: 78,
    rating: 4.8,
  },
  {
    title: 'Brand Color Palette Generator',
    description: 'Generate accessible color palettes from a single brand color. Hex, RGB, and Tailwind-style output.',
    product_type: 'design' as const,
    price_cents: 0,
    category: 'Design',
    tags: ['color', 'accessibility', 'palette'],
    preview_content: 'Input one hex; get primary, secondary, neutrals, and contrast-safe text colors.',
    is_published: true,
    purchase_count: 312,
    rating: 4.5,
  },
  {
    title: 'Content Approval Workflow',
    description: 'Step-by-step workflow template for content review: draft → edit → approve → publish. Includes checklist.',
    product_type: 'workflow' as const,
    price_cents: 299,
    category: 'Business',
    tags: ['workflow', 'content', 'approval'],
    preview_content: '1. Draft 2. Internal review 3. Edit 4. Final approval 5. Publish.',
    is_published: true,
    purchase_count: 45,
    rating: 4.4,
  },
  {
    title: 'Intro to Prompt Engineering',
    description: 'Short course: basics of prompting, few-shot examples, and chain-of-thought. Includes exercises.',
    product_type: 'course' as const,
    price_cents: 1999,
    category: 'Education',
    tags: ['prompts', 'ai', 'course'],
    preview_content: 'Module 1: What is a good prompt? Module 2: Examples and patterns. Module 3: Practice tasks.',
    is_published: true,
    purchase_count: 234,
    rating: 4.9,
  },
  {
    title: 'One-Page Portfolio Site',
    description: 'Minimal one-page portfolio template. Sections: About, Projects, Contact. Easy to customize.',
    product_type: 'code' as const,
    price_cents: 0,
    category: 'Design',
    tags: ['portfolio', 'website', 'minimal'],
    preview_content: 'Single HTML/React page with smooth scroll and optional dark mode.',
    is_published: true,
    purchase_count: 567,
    rating: 4.7,
  },
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const results: Record<string, { success: boolean; count?: number; error?: string }> = {}

    // Seed feed posts
    try {
      const { data: existingPosts } = await supabase
        .from('feed_posts')
        .select('id')
        .limit(1)

      if (!existingPosts || existingPosts.length === 0) {
        const postsWithUser = sampleFeedPosts.map(post => ({
          ...post,
          user_id: user.id,
        }))

        const { data, error } = await supabase
          .from('feed_posts')
          .insert(postsWithUser)
          .select()

        if (error) {
          results.feed_posts = { success: false, error: error.message }
        } else {
          results.feed_posts = { success: true, count: data?.length || 0 }
        }
      } else {
        results.feed_posts = { success: true, count: 0, error: 'Already seeded' }
      }
    } catch (e) {
      results.feed_posts = { success: false, error: String(e) }
    }

    // Seed courses
    try {
      const { data: existingCourses } = await supabase
        .from('courses')
        .select('id')
        .limit(1)

      if (!existingCourses || existingCourses.length === 0) {
        const coursesWithCreator = sampleCourses.map(course => ({
          ...course,
          created_by: user.id,
        }))

        const { data, error } = await supabase
          .from('courses')
          .insert(coursesWithCreator)
          .select()

        if (error) {
          results.courses = { success: false, error: error.message }
        } else {
          results.courses = { success: true, count: data?.length || 0 }
        }
      } else {
        results.courses = { success: true, count: 0, error: 'Already seeded' }
      }
    } catch (e) {
      results.courses = { success: false, error: String(e) }
    }

    // Seed agents
    try {
      const { data: existingAgents } = await supabase
        .from('agents')
        .select('id')
        .limit(1)

      if (!existingAgents || existingAgents.length === 0) {
        const agentsWithCreator = sampleAgents.map(agent => ({
          ...agent,
          created_by: user.id,
        }))

        const { data, error } = await supabase
          .from('agents')
          .insert(agentsWithCreator)
          .select()

        if (error) {
          results.agents = { success: false, error: error.message }
        } else {
          results.agents = { success: true, count: data?.length || 0 }
        }
      } else {
        results.agents = { success: true, count: 0, error: 'Already seeded' }
      }
    } catch (e) {
      results.agents = { success: false, error: String(e) }
    }

    // Seed knowledge nodes
    try {
      const { data: existingNodes } = await supabase
        .from('knowledge_nodes')
        .select('id')
        .limit(1)

      if (!existingNodes || existingNodes.length === 0) {
        const nodesWithUser = sampleKnowledgeNodes.map(node => ({
          ...node,
          user_id: user.id,
        }))

        const { data, error } = await supabase
          .from('knowledge_nodes')
          .insert(nodesWithUser)
          .select()

        if (error) {
          results.knowledge_nodes = { success: false, error: error.message }
        } else {
          results.knowledge_nodes = { success: true, count: data?.length || 0 }
        }
      } else {
        results.knowledge_nodes = { success: true, count: 0, error: 'Already seeded' }
      }
    } catch (e) {
      results.knowledge_nodes = { success: false, error: String(e) }
    }

    // Seed marketplace creations (products: text, code, templates, etc.)
    try {
      const { data: existingProducts } = await supabase
        .from('marketplace_products')
        .select('id')
        .limit(1)

      if (!existingProducts || existingProducts.length === 0) {
        // Get or create creator profile for the seeding user
        let { data: creatorProfile } = await supabase
          .from('creator_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!creatorProfile) {
          const { data: inserted } = await supabase
            .from('creator_profiles')
            .insert({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seed Creator',
              bio: 'Sample creator for seeded marketplace content.',
            })
            .select('id')
            .single()
          creatorProfile = inserted
        }

        if (creatorProfile) {
          const productsWithCreator = sampleCreations.map((p) => ({
            creator_id: creatorProfile!.id,
            title: p.title,
            description: p.description,
            product_type: p.product_type,
            price_cents: p.price_cents,
            category: p.category,
            tags: p.tags,
            preview_content: p.preview_content,
            full_content: (p as { full_content?: string }).full_content ?? null,
            is_published: p.is_published,
            purchase_count: p.purchase_count,
            rating: p.rating,
          }))

          const { data, error } = await supabase
            .from('marketplace_products')
            .insert(productsWithCreator)
            .select()

          if (error) {
            results.marketplace_creations = { success: false, error: error.message }
          } else {
            results.marketplace_creations = { success: true, count: data?.length || 0 }
          }
        } else {
          results.marketplace_creations = { success: false, error: 'Could not get or create creator profile' }
        }
      } else {
        results.marketplace_creations = { success: true, count: 0, error: 'Already seeded' }
      }
    } catch (e) {
      results.marketplace_creations = { success: false, error: String(e) }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeding completed',
      results,
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  // Allow GET for development - redirect to POST handler
  return POST(request)
}
