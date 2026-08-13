import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, MessageSquare } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DocSection {
  h: string
  p?: string
  bullets?: string[]
}

interface DocArticle {
  title: string
  category: string
  readTime: string
  intro: string
  sections: DocSection[]
  related?: string[]
}

const HUMAN: Record<string, string> = {
  understandingNairi: "Understanding Nairi",
  chatModes: "AI Chat Modes",
  creatingContent: "Creating Content",
  multiFormat: "Multi-format Creation",
  masterPrompts: "Master Prompts",
  howCreditsWork: "How Credits Work",
  earningCredits: "Earning Free Credits",
  watchEarn: "Watch & Earn",
  referrals: "Referral Program",
  plans: "Subscription Plans",
  browsingAgents: "Browsing Agents",
  purchasing: "Purchasing Agents",
  creatingAgents: "Creating Agents",
  selling: "Selling Your Work",
  reviews: "Reviews & Ratings",
  securityOverview: "Security Overview",
  isolatedExecution: "Isolated Execution",
  activityLogs: "Activity Logs",
  approvalGates: "Approval Gates",
  dataPrivacy: "Data Privacy",
  websites: "Websites",
  documents: "Documents",
  codeGeneration: "Code Generation",
  visualConcepts: "Visual Concepts",
  profile: "Profile Management",
  notifications: "Notification Settings",
  aiPreferences: "AI Preferences",
  language: "Language Settings",
  deleteAccount: "Deleting Your Account",
  earnCredits: "Earning 50 Credits Daily",
  firstPresentation: "Creating Your First Presentation",
  sellAgents: "Selling Agents in the Marketplace",
  securityBestPractices: "Security Best Practices",
  chat: "AI Chat Guide",
  credits: "Credits System",
  marketplace: "Marketplace Guide",
  security: "Security Docs",
}

const ARTICLES: Record<string, DocArticle> = {
  chat: {
    title: "AI Chat Guide",
    category: "Core Features",
    readTime: "5 min read",
    intro:
      "Master conversational AI with Nairi's chat interface. From quick answers to deep reasoning, every conversation works the same way.",
    sections: [
      {
        h: "Starting a conversation",
        p:
          "Open Chat from the dashboard or header and type your first message. Nairi keeps the full context of the conversation, so follow-up questions naturally build on what came before.",
        bullets: ["Open Chat from the dashboard or header", "Type a prompt or pick a saved template", "Continue the thread with follow-ups"],
      },
      {
        h: "Choosing a mode",
        p:
          "Different modes are optimized for different work. Use the default mode for general questions, reasoning for complex problems, and the tutor mode when you want to learn something step by step.",
      },
      {
        h: "Saving and reusing conversations",
        p:
          "Important threads are saved to your conversation history automatically. You can organize them into folders, search past messages, and export or share a conversation whenever you need it.",
        bullets: ["Conversations save automatically", "Organize with folders and search", "Export or share a thread"],
      },
    ],
    related: ["chat-modes", "master-prompts", "getting-started"],
  },

  credits: {
    title: "Credits System",
    category: "Credits & Billing",
    readTime: "4 min read",
    intro:
      "Credits power every action in Nairi — from chat messages to full content creations. Understanding how they're used helps you get the most out of your account.",
    sections: [
      {
        h: "What spends credits",
        p:
          "Generating presentations, websites, documents, images, and video all consume credits. Standard chat conversations use a small amount; large multi-format creations use more.",
      },
      {
        h: "Free credits",
        p:
          "New accounts start with 1,000 free credits. You can keep earning through daily logins, Watch & Learn activities, referrals, and streak rewards.",
        bullets: ["1,000 credits on sign-up", "Daily login bonuses", "Referral and activity rewards"],
      },
      {
        h: "Tracking your balance",
        p:
          "Your current balance and a full transaction history are available in Dashboard > Credits, so you always know what's left and where it went.",
      },
    ],
    related: ["how-credits-work", "earn-credits", "plans"],
  },

  marketplace: {
    title: "Marketplace Guide",
    category: "Marketplace",
    readTime: "4 min read",
    intro:
      "Discover AI agents and content products built by the Nairi community. The marketplace makes it easy to find tools, install them, and start using them right away.",
    sections: [
      {
        h: "Browsing the marketplace",
        p:
          "Browse by category, search by keyword, or check the recommendations on the home page. Every listing shows its capabilities, reviews, and install count.",
        bullets: ["Browse by category or search", "Read reviews and capabilities", "Check ratings before installing"],
      },
      {
        h: "Installing agents",
        p:
          "Free agents install in one click and appear in your workspace immediately. Paid products check out securely and are unlocked on your account after purchase.",
      },
      {
        h: "Creating and selling",
        p:
          "You can publish your own agents and creations. Listings with clear descriptions, a demo, and good screenshots perform best. Earnings are tracked in your creator dashboard.",
      },
    ],
    related: ["browsing-agents", "creating-agents", "selling"],
  },

  security: {
    title: "Security Docs",
    category: "Security & Trust",
    readTime: "4 min read",
    intro:
      "Nairi is built around transparency and control. Every AI action is isolated, logged, and gated behind your approval when it matters.",
    sections: [
      {
        h: "What Nairi does with your data",
        p:
          "Your conversations and creations are encrypted in transit and at rest. They are never sold or shared, and you can delete your data at any time.",
      },
      {
        h: "Isolated execution",
        p:
          "Code and AI-generated content run inside isolated, disposable environments. Nothing you generate can touch other users' data or your local machine.",
        bullets: ["Disposable sandboxes for every execution", "No cross-user data access", "Resource limits on every run"],
      },
      {
        h: "Approval gates and logs",
        p:
          "High-impact operations require your explicit approval, and every action is recorded in your activity log so you can review what happened and when.",
      },
    ],
    related: ["security-overview", "isolated-execution", "activity-logs"],
  },

  understandingNairi: {
    title: "Understanding Nairi",
    category: "Core Features",
    readTime: "5 min read",
    intro:
      "Nairi is an autonomous intelligent system that turns a single thought into a complete result — a presentation, a website, a document, or a working simulation.",
    sections: [
      {
        h: "One thought, one result",
        p:
          "You describe what you want and Nairi plans, generates, and assembles the finished output for you — including the supporting images, code, and structure.",
      },
      {
        h: "The creation types",
        p:
          "Nairi can build presentations, websites, documents, code projects, visual concepts, and interactive simulations from a single prompt.",
      },
      {
        h: "Your workspace",
        p:
          "Everything you create lives in your workspace, where you can open, edit, share, and revisit past work at any time.",
      },
    ],
    related: ["creating-content", "multi-format", "getting-started"],
  },

  chatModes: {
    title: "AI Chat Modes",
    category: "Core Features",
    readTime: "3 min read",
    intro:
      "Pick the right chat mode for the job. Each mode changes how Nairi reasons and responds.",
    sections: [
      {
        h: "Default mode",
        p: "Balanced responses for everyday questions, quick help, and general conversation.",
      },
      {
        h: "Reasoning mode",
        p:
          "Slower but more deliberate. Reasoning mode thinks through complex problems step by step — great for math, debugging, and analysis.",
      },
      {
        h: "Tutor mode",
        p:
          "Explains concepts in digestible steps and checks your understanding, ideal for learning new topics.",
      },
    ],
    related: ["chat", "master-prompts"],
  },

  creatingContent: {
    title: "Creating Content",
    category: "Core Features",
    readTime: "4 min read",
    intro:
      "Describe what you want and Nairi builds it. A good prompt is specific about the goal, audience, and style.",
    sections: [
      {
        h: "Write a clear brief",
        p:
          "Include the topic, the format, the audience, and the tone. 'A pitch deck for a recycling startup, clean and modern' beats 'a presentation'.",
      },
      {
        h: "Iterate on results",
        p:
          "You can ask for revisions in chat or open the result in the studio to adjust specific elements before exporting.",
      },
      {
        h: "Save and share",
        p: "Finished work is saved to your workspace. Export to the format you need or share it with a public link.",
      },
    ],
    related: ["multi-format", "master-prompts", "workspace"],
  },

  multiFormat: {
    title: "Multi-format Creation",
    category: "Core Features",
    readTime: "4 min read",
    intro:
      "Nairi isn't limited to text. From the same conversation you can generate images, charts, documents, and interactive content.",
    sections: [
      {
        h: "Combining formats",
        p:
          "Ask for an article with an accompanying chart and a header image, and Nairi assembles them into a single cohesive deliverable.",
      },
      {
        h: "Supported formats",
        p:
          "Presentations, documents, websites, images, audio, video, 3D scenes, and simulations are all available from one interface.",
        bullets: ["Slides and documents", "Images and charts", "Audio, video, and 3D", "Code and simulations"],
      },
      {
        h: "Consistent style",
        p:
          "Set a style once and Nairi keeps the palette and layout consistent across every format in the creation.",
      },
    ],
    related: ["creating-content", "visual-concepts"],
  },

  masterPrompts: {
    title: "Master Prompts",
    category: "Core Features",
    readTime: "5 min read",
    intro:
      "Great prompts get great results. These patterns produce consistent, high-quality output.",
    sections: [
      {
        h: "Structure your prompt",
        p:
          "Start with the goal, then add constraints: the format, the audience, the tone, and what to avoid.",
        bullets: ["State the goal first", "Add format and audience", "Specify tone and constraints"],
      },
      {
        h: "Give examples",
        p:
          "Reference a style or an existing creation. 'Similar to my last deck, but with a warmer palette' is a powerful instruction.",
      },
      {
        h: "Ask for alternatives",
        p:
          "Request two or three options when exploring. It's cheaper than regenerating and helps you converge faster.",
      },
    ],
    related: ["chat", "creating-content"],
  },

  howCreditsWork: {
    title: "How Credits Work",
    category: "Credits & Billing",
    readTime: "3 min read",
    intro:
      "Credits are Nairi's currency for AI work. Simple usage model, transparent pricing, and free ways to earn more.",
    sections: [
      {
        h: "The usage model",
        p:
          "Every generation deducts credits based on its complexity. Lightweight actions like simple chat use a fraction of the credits of a large video or 3D generation.",
      },
      {
        h: "Where to see usage",
        p: "Dashboard > Credits shows your balance, recent transactions, and a breakdown by activity.",
      },
      {
        h: "Keeping the pipeline full",
        p:
          "Daily logins, Watch & Earn, referrals, and streak rewards replenish your balance without spending a cent.",
      },
    ],
    related: ["credits", "earning-credits", "plans"],
  },

  earningCredits: {
    title: "Earning Free Credits",
    category: "Credits & Billing",
    readTime: "3 min read",
    intro: "There are several ways to keep a healthy credit balance without paying.",
    sections: [
      {
        h: "Daily rewards",
        p: "Log in every day to claim a login bonus and grow your daily streak for bigger rewards.",
      },
      {
        h: "Watch & Earn",
        p:
          "Short educational videos in Learn reward credits on completion. A few minutes a day adds up quickly.",
      },
      {
        h: "Refer friends",
        p:
          "Every friend who joins through your referral link earns you bonus credits the moment they complete sign-up.",
      },
    ],
    related: ["credits", "watch-earn", "referrals"],
  },

  earnCredits: {
    title: "How to Earn 50 Credits Daily",
    category: "Credits & Billing",
    readTime: "4 min read",
    intro:
      "A realistic daily routine to bank roughly 50 free credits in about ten minutes.",
    sections: [
      {
        h: "Claim the login bonus",
        p: "Open the app and claim your daily login reward — this alone covers a good chunk of the daily target.",
      },
      {
        h: "Complete a Watch & Earn video",
        p: "Finish one short lesson in Learn to collect its completion reward.",
      },
      {
        h: "Keep the streak alive",
        p: "Consecutive-day streaks multiply your rewards. Even a 30-second visit to claim the bonus protects it.",
      },
      {
        h: "Add a referral occasionally",
        p: "A single referral delivers a large one-time bonus, making the daily target easy to sustain.",
      },
    ],
    related: ["earning-credits", "credits", "watch-earn"],
  },

  watchEarn: {
    title: "Watch & Earn",
    category: "Credits & Billing",
    readTime: "2 min read",
    intro: "Turn learning time into credits.",
    sections: [
      {
        h: "How it works",
        p: "Each lesson in the Learn section carries a credit reward. Watch to the end and the credits land in your balance.",
      },
      {
        h: "Which lessons count",
        p: "Most notebook lessons and courses are eligible. Check the badge on each lesson card.",
      },
      {
        h: "Limits",
        p: "Rewards are capped per day to keep the economy fair — check your progress bar in Learn.",
      },
    ],
    related: ["earning-credits", "credits"],
  },

  referrals: {
    title: "Referral Program",
    category: "Credits & Billing",
    readTime: "2 min read",
    intro: "Invite friends and earn bonus credits for every successful sign-up.",
    sections: [
      {
        h: "Get your link",
        p: "Your unique referral link lives in Dashboard > Credits > Referrals.",
      },
      {
        h: "Share it anywhere",
        p: "Post it to friends, communities, or social media. The credit is added when a new user signs up through the link.",
      },
      {
        h: "No cap",
        p: "There's no limit on how many friends you can refer.",
      },
    ],
    related: ["credits", "earning-credits"],
  },

  plans: {
    title: "Subscription Plans",
    category: "Credits & Billing",
    readTime: "3 min read",
    intro: "Choose a plan that matches how much you create.",
    sections: [
      {
        h: "Free plan",
        p: "1,000 welcome credits, then daily earning activities. Perfect for exploring.",
      },
      {
        h: "Pro plan",
        p: "Monthly credits plus priority access to the fastest models and higher generation limits.",
      },
      {
        h: "Upgrading and downgrading",
        p: "Change plans any time from Dashboard > Billing. Credits never expire while your account is active.",
      },
    ],
    related: ["credits", "how-credits-work"],
  },

  browsingAgents: {
    title: "Browsing Agents",
    category: "Marketplace",
    readTime: "2 min read",
    intro: "Find the right agent for the task.",
    sections: [
      {
        h: "Search and filter",
        p: "Search by keyword, filter by category and price, and sort by popularity or rating.",
      },
      {
        h: "Review the details",
        p: "Open a listing to see capabilities, screenshots, reviews, and the version history.",
      },
      {
        h: "Install to try",
        p: "Free agents install in one click and are removed just as easily if they're not for you.",
      },
    ],
    related: ["marketplace", "reviews"],
  },

  purchasing: {
    title: "Purchasing Agents",
    category: "Marketplace",
    readTime: "2 min read",
    intro: "Buying from the marketplace is instant and safe.",
    sections: [
      {
        h: "Checkout",
        p: "Pay with card or available credits. The agent unlocks on your account immediately after purchase.",
      },
      {
        h: "Ownership",
        p: "Purchases are tied to your account, so you can reinstall the agent on any device.",
      },
      {
        h: "Refunds",
        p: "See the listing's refund policy before buying. Most issues are resolved directly with the seller.",
      },
    ],
    related: ["marketplace", "reviews"],
  },

  creatingAgents: {
    title: "Creating Agents",
    category: "Marketplace",
    readTime: "4 min read",
    intro: "Package your expertise as a reusable agent and publish it to the community.",
    sections: [
      {
        h: "Define the scope",
        p: "A focused agent that does one thing brilliantly outperforms a generalist. Pick a clear task and a clear output.",
      },
      {
        h: "Add examples",
        p: "Upload example outputs and screenshots. Buyers decide in seconds, so show your best work first.",
      },
      {
        h: "Price it",
        p: "Free agents build reputation and reviews; paid agents generate income. You can update pricing later.",
      },
    ],
    related: ["marketplace", "selling", "creating-agents"],
  },

  selling: {
    title: "Selling Your Work",
    category: "Marketplace",
    readTime: "3 min read",
    intro: "Turn your creations and agents into income.",
    sections: [
      {
        h: "Publish a listing",
        p: "Open Marketplace > Create, fill in the details, set a price, and submit for review.",
      },
      {
        h: "Track earnings",
        p: "Your creator dashboard shows sales, revenue, and payouts in real time.",
      },
      {
        h: "Improve over time",
        p: "Watch reviews, update your listings, and publish frequently to grow your audience.",
      },
    ],
    related: ["marketplace", "creating-agents", "reviews"],
  },

  sellAgents: {
    title: "Selling Agents in the Marketplace",
    category: "Marketplace",
    readTime: "4 min read",
    intro: "A practical walkthrough for publishing your first paid agent.",
    sections: [
      {
        h: "Polish the experience",
        p: "Test the agent end-to-end and include real screenshots of it working.",
      },
      {
        h: "Write a compelling description",
        p: "Lead with the problem it solves, then the specifics: inputs, outputs, and what makes it different.",
      },
      {
        h: "Launch with a fair price",
        p: "Pricing low early drives installs and reviews, which compound into visibility.",
      },
      {
        h: "Support your buyers",
        p: "Respond to reviews and keep the agent updated to protect your rating.",
      },
    ],
    related: ["marketplace", "selling", "reviews"],
  },

  reviews: {
    title: "Reviews & Ratings",
    category: "Marketplace",
    readTime: "2 min read",
    intro: "Reviews keep the marketplace trustworthy.",
    sections: [
      {
        h: "Leaving a review",
        p: "After installing or purchasing, rate the agent and describe your experience.",
      },
      {
        h: "Reading reviews",
        p: "Check the review breakdown for signal on reliability, output quality, and support.",
      },
      {
        h: "Review policy",
        p: "Reviews must be genuine and about the product — spam and paid reviews are removed.",
      },
    ],
    related: ["marketplace", "browsing-agents"],
  },

  securityOverview: {
    title: "Security Overview",
    category: "Security & Trust",
    readTime: "3 min read",
    intro: "A summary of the controls that keep your account and data safe.",
    sections: [
      {
        h: "Encryption everywhere",
        p: "Data is encrypted in transit and at rest. Access keys are stored securely and never logged.",
      },
      {
        h: "Least privilege",
        p: "Every operation runs with the minimum permissions needed — and nothing more.",
      },
      {
        h: "You stay in control",
        p: "Approval gates, activity logs, and immediate data deletion are available on every account.",
      },
    ],
    related: ["security", "isolated-execution", "data-privacy"],
  },

  isolatedExecution: {
    title: "Isolated Execution",
    category: "Security & Trust",
    readTime: "3 min read",
    intro: "Every AI action runs in its own disposable sandbox.",
    sections: [
      {
        h: "Why isolation",
        p: "If a generated script misbehaves, it can only affect its own sandbox — never your data or other users.",
      },
      {
        h: "How it works",
        p: "Each execution spins up a fresh environment, runs the task, and tears the environment down.",
      },
      {
        h: "Resource limits",
        p: "Sandboxes are time- and resource-bounded, so runaway jobs stop automatically.",
      },
    ],
    related: ["security", "security-overview", "approval-gates"],
  },

  activityLogs: {
    title: "Activity Logs",
    category: "Security & Trust",
    readTime: "2 min read",
    intro: "Full transparency into everything Nairi does on your behalf.",
    sections: [
      {
        h: "What gets logged",
        p: "Every generation, approval, share, and settings change is recorded with a timestamp.",
      },
      {
        h: "Where to find it",
        p: "Dashboard > Activity shows your complete history. Execution traces add deeper detail for technical users.",
      },
      {
        h: "Reviewing for anomalies",
        p: "Regular log reviews are the fastest way to spot unexpected activity on your account.",
      },
    ],
    related: ["security", "approval-gates"],
  },

  approvalGates: {
    title: "Approval Gates",
    category: "Security & Trust",
    readTime: "2 min read",
    intro: "High-impact actions require your explicit go-ahead.",
    sections: [
      {
        h: "What triggers a gate",
        p: "Actions that cost significant credits, touch external services, or install code require approval.",
      },
      {
        h: "How approval works",
        p: "You get a clear description of the action and its cost. Approve or deny with one click.",
      },
      {
        h: "Tuning the gates",
        p: "Adjust the approval threshold in Settings to match how much autonomy you want.",
      },
    ],
    related: ["security", "activity-logs"],
  },

  dataPrivacy: {
    title: "Data Privacy",
    category: "Security & Trust",
    readTime: "3 min read",
    intro: "Your data belongs to you. Period.",
    sections: [
      {
        h: "What we collect",
        p: "The minimum needed to run the service: your account, your conversations, and your creations.",
      },
      {
        h: "What we never do",
        p: "We don't sell your data, train public models on your content, or share it with advertisers.",
      },
      {
        h: "Your rights",
        p: "Export or permanently delete your data at any time from Dashboard > Settings.",
      },
    ],
    related: ["security", "delete-account"],
  },

  securityBestPractices: {
    title: "Security Best Practices",
    category: "Security & Trust",
    readTime: "3 min read",
    intro: "Small habits that keep your Nairi account secure.",
    sections: [
      {
        h: "Use a strong, unique password",
        p: "A password manager makes this effortless. Enable two-factor authentication if available.",
      },
      {
        h: "Review activity regularly",
        p: "A weekly glance at your activity log catches anything unexpected early.",
      },
      {
        h: "Approve deliberately",
        p: "Read approval prompts before clicking. If an action looks wrong, deny it.",
      },
    ],
    related: ["security", "activity-logs", "approval-gates"],
  },

  websites: {
    title: "Websites",
    category: "Creation Types",
    readTime: "3 min read",
    intro: "Generate complete, modern websites from a single description.",
    sections: [
      {
        h: "Describe the site",
        p: "Give the purpose, sections, and style. Nairi generates the full structure, copy, and layout.",
      },
      {
        h: "Edit before shipping",
        p: "Open the result in the workspace to refine sections, swap content, and adjust styling.",
      },
      {
        h: "Export",
        p: "Download the codebase or publish a preview link to share with others.",
      },
    ],
    related: ["creating-content", "code-generation"],
  },

  documents: {
    title: "Documents",
    category: "Creation Types",
    readTime: "2 min read",
    intro: "Reports, articles, and proposals generated and formatted for you.",
    sections: [
      {
        h: "Pick a template",
        p: "Start from a template or freeform. Nairi writes the content and applies clean, consistent formatting.",
      },
      {
        h: "Add visuals",
        p: "Ask for charts and images and they're generated and embedded in the right places.",
      },
      {
        h: "Export formats",
        p: "Download as document, PDF, or presentation-ready slides.",
      },
    ],
    related: ["creating-content", "multi-format"],
  },

  codeGeneration: {
    title: "Code Generation",
    category: "Creation Types",
    readTime: "3 min read",
    intro: "From prototypes to production components, Nairi writes and runs code.",
    sections: [
      {
        h: "Describe the feature",
        p: "Explain what the code should do and the stack you prefer. Nairi produces complete, runnable code.",
      },
      {
        h: "Run in a sandbox",
        p: "Generated code executes in an isolated environment where you can test it safely.",
      },
      {
        h: "Take it with you",
        p: "Export the project or copy individual files into your own repository.",
      },
    ],
    related: ["websites", "isolated-execution"],
  },

  visualConcepts: {
    title: "Visual Concepts",
    category: "Creation Types",
    readTime: "2 min read",
    intro: "Images, charts, and 3D scenes from a text description.",
    sections: [
      {
        h: "Image generation",
        p: "Describe the scene, style, and composition. Nairi generates and refines images to match.",
      },
      {
        h: "Charts and diagrams",
        p: "Feed in data or ask for an explanatory chart and get a clean, styled visual.",
      },
      {
        h: "3D scenes",
        p: "Describe a scene and generate a 3D asset you can rotate, animate, and export.",
      },
    ],
    related: ["creating-content", "multi-format"],
  },

  profile: {
    title: "Profile Management",
    category: "Account & Settings",
    readTime: "2 min read",
    intro: "Keep your profile accurate and professional.",
    sections: [
      {
        h: "Update your details",
        p: "Change your name, avatar, and public bio from Dashboard > Profile.",
      },
      {
        h: "Profile visibility",
        p: "Your profile is visible to other users when you publish creations or reviews.",
      },
    ],
    related: ["notifications", "settings"],
  },

  notifications: {
    title: "Notification Settings",
    category: "Account & Settings",
    readTime: "2 min read",
    intro: "Choose how and when Nairi contacts you.",
    sections: [
      {
        h: "Email preferences",
        p: "Opt in or out of product updates, security alerts, and promotional email.",
      },
      {
        h: "In-app notifications",
        p: "Toggle notifications for mentions, purchases, and activity on your listings.",
      },
      {
        h: "Security alerts",
        p: "Security notifications are always on — they're too important to mute.",
      },
    ],
    related: ["profile", "settings"],
  },

  aiPreferences: {
    title: "AI Preferences",
    category: "Account & Settings",
    readTime: "2 min read",
    intro: "Tune how Nairi responds and creates for you.",
    sections: [
      {
        h: "Default mode",
        p: "Choose which chat mode new conversations open with.",
      },
      {
        h: "Style defaults",
        p: "Set a preferred visual style that new creations start from.",
      },
      {
        h: "Privacy for training",
        p: "Control whether your content can be used to improve models.",
      },
    ],
    related: ["settings", "chat-modes"],
  },

  language: {
    title: "Language Settings",
    category: "Account & Settings",
    readTime: "2 min read",
    intro: "Use Nairi in the language that's most comfortable for you.",
    sections: [
      {
        h: "Interface language",
        p: "Change the interface language from Settings > Language.",
      },
      {
        h: "Generation language",
        p: "Nairi responds in the language you write in by default, and you can pin a preferred output language.",
      },
    ],
    related: ["settings", "profile"],
  },

  deleteAccount: {
    title: "Deleting Your Account",
    category: "Account & Settings",
    readTime: "2 min read",
    intro: "Leaving? Here's exactly what happens.",
    sections: [
      {
        h: "What's deleted",
        p: "Your conversations, creations, and marketplace listings are removed. This is permanent.",
      },
      {
        h: "What's retained",
        p: "We keep minimal records only where required by law, and never for marketing.",
      },
      {
        h: "How to do it",
        p: "Dashboard > Settings > Delete account, then confirm. You can always come back and start fresh.",
      },
    ],
    related: ["data-privacy", "settings"],
  },

  firstPresentation: {
    title: "Creating Your First Presentation",
    category: "Creation Types",
    readTime: "5 min read",
    intro: "Go from an idea to a finished, polished deck in minutes.",
    sections: [
      {
        h: "Write the brief",
        p: "State the topic, the audience, and how many slides you want. Add a style word like 'minimal' or 'bold'.",
      },
      {
        h: "Generate and review",
        p: "Nairi builds the outline, writes the slides, and generates supporting visuals. Read it top to bottom.",
      },
      {
        h: "Refine in the studio",
        p: "Adjust slide order, swap images, and edit copy in the presentation studio.",
      },
      {
        h: "Present or export",
        p: "Present directly, download as PPTX or PDF, or share a public link.",
      },
    ],
    related: ["presentations", "creating-content", "master-prompts"],
  },
}

function kebabToCamel(slug: string): string {
  return slug.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())
}

function camelToKebab(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

function humanizeSlug(slug: string): string {
  if (slug === "security/bug-bounty") return "Bug Bounty Program"
  const key = kebabToCamel(slug)
  if (HUMAN[key]) return HUMAN[key]
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function resolveRelated(slug: string): string[] {
  const article = ARTICLES[kebabToCamel(slug)]
  if (article?.related?.length) return article.related
  const pool = ["chat", "credits", "marketplace", "security"]
  return pool.filter((s) => s !== slug).slice(0, 3)
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => ({
    title: `${humanizeSlug(slug)} | Nairi Documentation`,
    description: `Learn how to use ${humanizeSlug(slug)} in Nairi.`,
  }))
}

export default async function DocsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES[kebabToCamel(slug)]

  if (!article) {
    notFound()
  }

  const related = resolveRelated(slug)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Link>
          <Badge className="bg-[#e879f9]/10 text-[#e879f9] border-0">
            <BookOpen className="w-3 h-3 mr-1" />
            Guide
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <Badge className="mb-4 bg-[#22d3ee]/10 text-[#22d3ee] border-0">{article.category}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{article.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{article.intro}</p>
          <span className="text-sm text-muted-foreground mt-2 inline-block">{article.readTime}</span>
        </div>

        <div className="space-y-8">
          {article.sections.map((section, index) => (
            <section key={index} className="max-w-3xl">
              <h2 className="text-xl font-semibold text-foreground mb-2">{section.h}</h2>
              {section.p && <p className="text-muted-foreground leading-relaxed">{section.p}</p>}
              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet, bi) => (
                    <li key={bi} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[#22d3ee] shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <Card className="mt-16 bg-card/50 border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Related guides</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => {
                const relSlug = /^[a-z]+$/.test(r) ? r : camelToKebab(r)
                return (
                  <Link
                    key={r}
                    href={`/docs/${relSlug}`}
                    className="p-4 rounded-lg border border-border bg-background/50 hover:border-[#e879f9]/50 transition-colors group"
                  >
                    <h4 className="font-medium text-foreground group-hover:text-[#e879f9] transition-colors text-sm">
                      {humanizeSlug(relSlug)}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Read the guide</p>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
            <Link href="/contact">
              Contact Support
              <MessageSquare className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="text-center mt-6">
          <Link href="/docs" className="inline-flex items-center gap-1 text-sm text-[#e879f9] hover:underline">
            Browse all documentation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
