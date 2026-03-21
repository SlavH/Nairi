// Nairi Internationalization System
// Supports: English (en), Russian (ru), Armenian (hy)

export type Locale = "en" | "ru" | "hy"

export const SUPPORTED_LOCALES: Locale[] = ["en", "ru", "hy"]

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  hy: "Հայերեն",
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇺🇸",
  ru: "🇷🇺",
  hy: "🇦🇲",
}

export interface TranslationStrings {
  // Common
  common: {
    loading: string
    error: string
    save: string
    cancel: string
    confirm: string
    delete: string
    edit: string
    create: string
    search: string
    back: string
    next: string
    previous: string
    submit: string
    close: string
    yes: string
    no: string
    or: string
    and: string
    signIn: string
    signUp: string
    signOut: string
    getStarted: string
    skipToMainContent: string
    openNavigationMenu: string
    closeNavigation: string
    openNavigationHub: string
    home: string
  }
  // Header/Navigation
  nav: {
    howItWorks: string
    capabilities: string
    marketplace: string
    security: string
    dashboard: string
    chat: string
    learn: string
    flow: string
    knowledge: string
    debate: string
    billing: string
    settings: string
    builder: string
    docs: string
    discover: string
    community: string
    profile: string
    website: string
    slides: string
    simulate: string
    creations: string
    traces: string
    earn: string
    projects: string
    people: string
    companies: string
    custom: string
    logout: string
    activity: string
    workspace: string
    notifications: string
    credits: string
  }
  // Hero Section
  hero: {
    badge: string
    title: string
    subtitle: string
    tagline: string
    cta: string
    secondaryCta: string
    interfaceTitle: string
    typingText: string
    responseText: string
    responseItems: {
      item1: string
      item2: string
      item3: string
      item4: string
    }
    downloadButton: string
    editButton: string
  }
  // Chat Interface
  chat: {
    title: string
    placeholder: string
    sendMessage: string
    newConversation: string
    conversations: string
    modes: {
      default: string
      defaultDesc: string
      debate: string
      debateDesc: string
      reasoning: string
      reasoningDesc: string
      tutor: string
      tutorDesc: string
      creator: string
      creatorDesc: string
    }
    confidence: {
      high: string
      moderate: string
      low: string
      explanation: string
    }
    explainWhy: {
      button: string
      title: string
      reasoning: string
      sources: string
      confidence: string
      alternatives: string
    }
    sidebarNewChat: string
    sidebarCreating: string
    sidebarSearchPlaceholder: string
    sidebarPinned: string
    sidebarHistory: string
    sidebarNoConversations: string
    sidebarNoMatching: string
    sidebarEdit: string
    sidebarDelete: string
    sidebarShare: string
    sidebarRenameConversation: string
    sidebarRenameProject: string
    sidebarProjectName: string
    sidebarConversationTitle: string
    sidebarBrowseMarketplace: string
    sidebarProjects: string
    sidebarAll: string
    sidebarNewProject: string
    sidebarNoProjects: string
    sidebarUnpin: string
    sidebarPin: string
    sidebarOpenMenu: string
    sidebarCloseMenu: string
    sidebarMoreOptions: string
    sidebarGoToDashboard: string
    sidebarStartNewChat: string
    builderModeTitle: string
    learnModeTitle: string
    howCanIHelp: string
    placeholderBuilder: string
    placeholderLearn: string
    placeholderDefault: string
    send: string
    voiceInput: string
    attachFile: string
    copyMessage: string
    copied: string
    suggestionContinue: string
    suggestionExplain: string
    suggestionSimplify: string
    suggestionExample: string
  }
  // Trust & Safety
  trust: {
    confidenceScore: string
    sourceStrength: string
    peerReviewed: string
    firstHand: string
    opinion: string
    factual: string
    reasoning: string
    sourceQuality: string
    verifyWithSources: string
    antiEchoChamber: string
    opposingView: string
    approvalRequired: string
    reviewAction: string
  }
  // Cognitive Features
  cognitive: {
    fatigueDetected: string
    takeBreak: string
    overloadWarning: string
    slowingDown: string
    attentionBudget: string
    whyDoingThis: string
    purposeCheck: string
    goalAlignment: string
  }
  // Learning
  learn: {
    title: string
    subtitle: string
    skillTree: string
    courses: string
    learningPaths: string
    mySkills: string
    totalXP: string
    completed: string
    streak: string
    skillsMastered: string
    continueWhere: string
    productiveStruggle: string
    tryYourself: string
    errorMemory: string
    revisitTopic: string
  }
  // Marketplace
  marketplace: {
    title: string
    subtitle: string
    featured: string
    allAgents: string
    free: string
    getAgent: string
    useAgent: string
    createAgent: string
    sellAgent: string
    creatorEconomy: string
    earnings: string
    sales: string
    rating: string
    reviews: string
    publish: string
    draft: string
  }
  // Settings & Governance
  settings: {
    title: string
    subtitle: string
    profile: string
    preferences: string
    aiGovernance: string
    behaviorSliders: string
    strictness: string
    creativity: string
    assertiveness: string
    memoryPermissions: string
    whatToRemember: string
    howLong: string
    whichContexts: string
    dataRetention: string
    exportData: string
    deleteData: string
  }
  // Debate
  debate: {
    title: string
    subtitle: string
    startDebate: string
    topic: string
    yourStance: string
    perspectives: string
    concludeDebate: string
    synthesis: string
    keyTensions: string
    submitArgument: string
  }
  // How It Works Section
  howItWorks: {
    title: string
    subtitle: string
    steps: {
      speakMind: {
        title: string
        description: string
      }
      understands: {
        title: string
        description: string
      }
      execution: {
        title: string
        description: string
      }
      receiveResult: {
        title: string
        description: string
      }
    }
  }
  // Marketplace Section
  marketplaceSection: {
    title: string
    subtitle: string
    trendingCreations: string
    thisWeek: string
    exploreMarketplace: string
    features: {
      sellCreations: {
        title: string
        description: string
      }
      discoverAcquire: {
        title: string
        description: string
      }
      remixImprove: {
        title: string
        description: string
      }
      growTogether: {
        title: string
        description: string
      }
    }
  }
  // Demo Modal
  demoModal: {
    title: string
    description: string
    demoVideoComingSoon: string
    videos: {
      presentations: string
      websites: string
      reports: string
    }
  }
  // Auth Modal
  auth: {
    welcomeTitle: string
    welcomeDescription: string
    signInTab: string
    signUpTab: string
    email: string
    password: string
    fullName: string
    signInButton: string
    createAccountButton: string
    signInPlaceholder: string
    signUpPlaceholder: string
    createPasswordPlaceholder: string
    fullNamePlaceholder: string
    orContinueWith: string
    github: string
    google: string
    signInSuccess: string
    signUpSuccess: string
  }
  // Waitlist Modal
  waitlist: {
    title: string
    description: string
    emailLabel: string
    emailPlaceholder: string
    earlyAccessBenefits: string
    benefits: {
      priorityAccess: string
      extendedLimits: string
      exclusiveCommunity: string
    }
    joinWaitlistButton: string
    successTitle: string
    successMessage: string
    closeButton: string
  }
  // Limits Section
  limits: {
    title: string
    subtitle: string
    noPaywall: string
    dailyCredits: string
    creditsUsed: string
    resetsIn: string
    methods: {
      watchAndEarn: {
        title: string
        description: string
        bonus: string
      }
      inviteFriends: {
        title: string
        description: string
        bonus: string
      }
      stayActive: {
        title: string
        description: string
        bonus: string
      }
      marketplaceActivity: {
        title: string
        description: string
        bonus: string
      }
    }
  }
  // Future Section
  future: {
    horizon: string
    title: string
    subtitle: string
    quote: string
    beginJourney: string
    joinWaitlist: string
  }
  // Security Section
  security: {
    title: string
    subtitle: string
    features: {
      isolatedExecution: {
        title: string
        description: string
        details: string
      }
      fullTransparency: {
        title: string
        description: string
        details: string
      }
      criticalConfirmation: {
        title: string
        description: string
        details: string
      }
      intelligentRefusal: {
        title: string
        description: string
        details: string
      }
    }
  }
  // Login Page
  login: {
    welcomeBack: string
    signInTitle: string
    signInDescription: string
    email: string
    password: string
    signInButton: string
    signingIn: string
    dontHaveAccount: string
    signUp: string
    backToHome: string
    passwordsDontMatch: string
    passwordTooShort: string
    forgotPassword: string
  }
  // Forgot Password Page
  forgotPassword: {
    title: string
    cardTitle: string
    cardDescription: string
    sendLink: string
    sending: string
    checkEmail: string
    emailSent: string
    checkSpam: string
    tryAgain: string
    backToLogin: string
  }
  // Reset Password Page
  resetPassword: {
    title: string
    cardTitle: string
    cardDescription: string
    newPassword: string
    confirmPassword: string
    updatePassword: string
    updating: string
    success: string
    successMessage: string
    continueToLogin: string
  }
  // Sign Up Page
  signUp: {
    createAccount: string
    signUpTitle: string
    signUpDescription: string
    fullName: string
    email: string
    password: string
    confirmPassword: string
    createAccountButton: string
    creatingAccount: string
    alreadyHaveAccount: string
    signIn: string
    backToHome: string
    passwordsDontMatch: string
    passwordTooShort: string
    invalidEmailFormat: string
    emailAlreadyInUse: string
    emailServiceError: string
  }
  // Capabilities Section
  capabilities: {
    title: string
    subtitle: string
    comingSoon: string
    examplesLabel: string
    items: {
      textFormats: {
        title: string
        description: string
        examples: string[]
      }
      presentations: {
        title: string
        description: string
        examples: string[]
      }
      websites: {
        title: string
        description: string
        examples: string[]
      }
      visuals: {
        title: string
        description: string
        examples: string[]
      }
      games: {
        title: string
        description: string
        examples: string[]
      }
      ideas: {
        title: string
        description: string
        examples: string[]
      }
      simulations: {
        title: string
        description: string
        examples: string[]
      }
      more: {
        title: string
        description: string
        examples: string[]
      }
    }
  }
  // Footer
  footer: {
    description: string
    joinWaitlist: string
    productSection: string
    companySection: string
    legalSection: string
    copyright: string
    links: {
      howItWorks: string
      capabilities: string
      marketplace: string
      pricing: string
      about: string
      blog: string
      careers: string
      contact: string
      privacy: string
      terms: string
      security: string
    }
  }
  // Errors & Feedback
  feedback: {
    helpful: string
    notHelpful: string
    reportIssue: string
    thankYou: string
    errorOccurred: string
    tryAgain: string
    somethingWentWrong: string
    errorDescription: string
  }
  // Dashboard
  dashboard: {
    welcome: string
    welcomeDescription: string
    tokensBalance: string
    activeAgents: string
    conversations: string
    usageTime: string
    today: string
    thisWeek: string
    thisMonth: string
    free: string
    quickActions: string
    quickActionsDesc: string
    startNewConversation: string
    browseMarketplace: string
    upgradePlan: string
    recentConversations: string
    recentConversationsDesc: string
    yourAgents: string
    yourAgentsDesc: string
    viewAll: string
    newConversation: string
    searchPlaceholder: string
    plan: string
    workspace: string
    builder: string
    activity: string
    executionTraces: string
    notifications: string
    creditsRewards: string
  }
}

export const translations: Record<Locale, TranslationStrings> = {
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      back: "Back",
      next: "Next",
      previous: "Previous",
      submit: "Submit",
      close: "Close",
      yes: "Yes",
      no: "No",
      or: "or",
      and: "and",
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      getStarted: "Get Started",
      skipToMainContent: "Skip to main content",
      openNavigationMenu: "Open navigation menu",
      closeNavigation: "Close navigation",
      openNavigationHub: "Open navigation hub",
      home: "Home",
    },
    nav: {
      howItWorks: "How it works",
      capabilities: "Capabilities",
      marketplace: "Marketplace",
      security: "Security",
      dashboard: "Dashboard",
      chat: "AI Chat",
      learn: "Nairi Learn",
      flow: "Nairi Flow",
      knowledge: "Knowledge Graph",
      debate: "Debate Mode",
      billing: "Billing",
      settings: "Settings",
      builder: "Builder",
      docs: "Docs",
      discover: "Discover",
      community: "Community",
      profile: "Profile",
      website: "Website",
      slides: "Slides",
      simulate: "Simulate",
      creations: "Creations",
      traces: "Traces",
      earn: "Earn",
      projects: "Projects",
      people: "People",
      companies: "Companies",
      custom: "Custom",
      logout: "Logout",
      activity: "Activity",
      workspace: "Workspace",
      notifications: "Notifications",
      credits: "Credits",
    },
    hero: {
      badge: "The future of human-computer interaction",
      title: "One thought.",
      subtitle: "Complete reality.",
      tagline: "Nairi is not an assistant. It is a reality executor. Speak your intention — receive the finished result. No steps. No learning curves. Just outcome.",
      cta: "Start Creating",
      secondaryCta: "Watch Demo",
      interfaceTitle: "Nairi Interface",
      typingText: "Create a presentation about renewable energy for tomorrow's meeting",
      responseText: "Your presentation is ready. 12 slides covering:",
      responseItems: {
        item1: "Current energy landscape",
        item2: "Solar, wind, and hydro analysis",
        item3: "Implementation roadmap",
        item4: "ROI projections with data visualizations",
      },
      downloadButton: "Download",
      editButton: "Edit",
    },
    chat: {
      title: "AI Chat",
      placeholder: "Type your message...",
      sendMessage: "Send",
      newConversation: "New Conversation",
      conversations: "Conversations",
      modes: {
        default: "Chat",
        defaultDesc: "General conversation",
        debate: "Debate",
        debateDesc: "Explore multiple perspectives",
        reasoning: "Reasoning",
        reasoningDesc: "Step-by-step analysis",
        tutor: "Tutor",
        tutorDesc: "Learn with guidance",
        creator: "Creator",
        creatorDesc: "Creative assistance",
      },
      confidence: {
        high: "High confidence",
        moderate: "Moderate confidence",
        low: "Lower confidence",
        explanation: "AI confidence in this response",
      },
      explainWhy: {
        button: "Explain Why",
        title: "Understanding This Response",
        reasoning: "Reasoning Process",
        sources: "Source Information",
        confidence: "Confidence Breakdown",
        alternatives: "Alternative Perspectives",
      },
    sidebarNewChat: "New Chat",
    sidebarCreating: "Creating...",
    sidebarSearchPlaceholder: "Search conversations...",
    sidebarPinned: "Pinned",
    sidebarHistory: "History",
    sidebarNoConversations: "No conversations yet",
    sidebarNoMatching: "No matching conversations",
    sidebarEdit: "Edit",
    sidebarDelete: "Delete",
    sidebarShare: "Share",
    sidebarRenameConversation: "Rename conversation",
    sidebarRenameProject: "Rename project",
    sidebarProjectName: "Project name",
    sidebarConversationTitle: "Conversation title",
    sidebarBrowseMarketplace: "Browse Marketplace",
    sidebarProjects: "Projects",
    sidebarAll: "All",
    sidebarNewProject: "New project",
    sidebarNoProjects: "No projects yet",
    sidebarUnpin: "Unpin",
    sidebarPin: "Pin",
    sidebarOpenMenu: "Open chat menu",
    sidebarCloseMenu: "Close chat menu",
    sidebarMoreOptions: "More options",
    sidebarGoToDashboard: "Go to dashboard",
    sidebarStartNewChat: "Start new chat",
    builderModeTitle: "Builder Mode",
    learnModeTitle: "Learn Mode",
    howCanIHelp: "How can I help you today?",
    placeholderBuilder: "Describe what you want to build...",
    placeholderLearn: "What would you like to learn about?",
    placeholderDefault: "Describe your goal...",
    send: "Send",
    voiceInput: "Voice input",
    attachFile: "Attach file",
    copyMessage: "Copy message",
    copied: "Copied",
    suggestionContinue: "Continue",
    suggestionExplain: "Explain in more detail",
    suggestionSimplify: "Simplify this",
    suggestionExample: "Give me an example",
  },
  trust: {
    confidenceScore: "Confidence Score",
      sourceStrength: "Source Strength",
      peerReviewed: "Peer Reviewed",
      firstHand: "First-Hand",
      opinion: "Opinion",
      factual: "Factual Accuracy",
      reasoning: "Reasoning Quality",
      sourceQuality: "Source Quality",
      verifyWithSources: "Consider verifying with additional sources",
      antiEchoChamber: "Alternative Viewpoint",
      opposingView: "Here's a different perspective to consider",
      approvalRequired: "Approval Required",
      reviewAction: "Review this action before proceeding",
    },
    cognitive: {
      fatigueDetected: "Fatigue Detected",
      takeBreak: "Consider taking a short break",
      overloadWarning: "Information Overload",
      slowingDown: "Let's slow down and focus on one concept",
      attentionBudget: "Attention Budget",
      whyDoingThis: "Why Are You Doing This?",
      purposeCheck: "Let's make sure this aligns with your goals",
      goalAlignment: "Goal Alignment Check",
    },
    learn: {
      title: "Nairi Learn",
      subtitle: "Your personalized learning journey",
      skillTree: "Skill Tree",
      courses: "Courses",
      learningPaths: "Learning Paths",
      mySkills: "My Skills",
      totalXP: "Total XP",
      completed: "Completed",
      streak: "Current Streak",
      skillsMastered: "Skills Mastered",
      continueWhere: "Continue where you left off",
      productiveStruggle: "Try It Yourself",
      tryYourself: "Before I give you the answer, try working through this",
      errorMemory: "We noticed you struggled with this before",
      revisitTopic: "Let's approach it differently this time",
    },
    marketplace: {
      title: "AI Agent Marketplace",
      subtitle: "Discover and unlock powerful AI agents",
      featured: "Featured Agents",
      allAgents: "All Agents",
      free: "Free",
      getAgent: "Get Agent",
      useAgent: "Use Agent",
      createAgent: "Create Agent",
      sellAgent: "Sell Your Agent",
      creatorEconomy: "Creator Economy",
      earnings: "Earnings",
      sales: "Sales",
      rating: "Rating",
      reviews: "Reviews",
      publish: "Publish",
      draft: "Draft",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account and AI preferences",
      profile: "Profile",
      preferences: "Preferences",
      aiGovernance: "AI Governance",
      behaviorSliders: "Behavior Controls",
      strictness: "Strictness",
      creativity: "Creativity",
      assertiveness: "Assertiveness",
      memoryPermissions: "Memory Permissions",
      whatToRemember: "What AI can remember",
      howLong: "For how long",
      whichContexts: "In which contexts",
      dataRetention: "Data Retention",
      exportData: "Export Data",
      deleteData: "Delete Data",
    },
    capabilities: {
      title: "Create everything",
      subtitle: "Whatever you can imagine, Nairi can materialize. Not templates — original creations tailored to your intent.",
      comingSoon: "Soon",
      examplesLabel: "Examples:",
      items: {
        textFormats: {
          title: "Any text format",
          description: "Essays, reports, scripts, emails, legal documents — written, formatted, and polished.",
          examples: ["Business proposals", "Legal contracts", "Marketing copy"],
        },
        presentations: {
          title: "Presentations",
          description: "Complete slide decks with visuals, data, and compelling narratives.",
          examples: ["Pitch decks", "Training materials", "Conference talks"],
        },
        websites: {
          title: "Websites & Interfaces",
          description: "Full digital experiences designed, built, and ready to deploy.",
          examples: ["Landing pages", "Web apps", "Dashboards"],
        },
        visuals: {
          title: "Visual concepts",
          description: "Images, illustrations, and design systems that match your vision.",
          examples: ["Brand identity", "Social graphics", "Product mockups"],
        },
        games: {
          title: "Games",
          description: "Interactive experiences and game concepts.",
          examples: ["Browser games", "Prototypes", "Game design"],
        },
        ideas: {
          title: "Ideas & Strategies",
          description: "Business plans, marketing strategies, creative concepts — fully developed.",
          examples: ["Go-to-market plans", "Content calendars", "Growth strategies"],
        },
        simulations: {
          title: "Simulations",
          description: "Model scenarios, test hypotheses, explore possibilities.",
          examples: ["Market simulations", "A/B testing", "Predictive models"],
        },
        more: {
          title: "And more...",
          description: "Nairi's capabilities expand continuously with each interaction.",
          examples: ["Custom workflows", "Integrations", "Automations"],
        },
      },
    },
    howItWorks: {
      title: "From thought to reality",
      subtitle: "Nairi eliminates the gap between your intention and the outcome. No learning. No process. Just results.",
      steps: {
        speakMind: {
          title: "Speak your mind",
          description: "Express your intention in natural language. No specific commands, no syntax — just your thought.",
        },
        understands: {
          title: "Nairi understands",
          description: "The system analyzes your intent, identifies the hidden goal, and determines the optimal approach.",
        },
        execution: {
          title: "Autonomous execution",
          description: "Nairi plans, executes, and verifies — handling every step without your involvement.",
        },
        receiveResult: {
          title: "Receive the result",
          description: "Get the finished product, not instructions. Ready to use, share, or build upon.",
        },
      },
    },
    marketplaceSection: {
      title: "The ecosystem of creation",
      subtitle: "Nairi Marketplace is where human creativity meets intelligent execution. Share what you've built, monetize your ideas, and leverage the collective intelligence of the community.",
      trendingCreations: "Trending Creations",
      thisWeek: "This week",
      exploreMarketplace: "Explore Marketplace",
      features: {
        sellCreations: {
          title: "Sell your creations",
          description: "Everything you create with Nairi can be listed in the marketplace.",
        },
        discoverAcquire: {
          title: "Discover & acquire",
          description: "Browse thousands of ready-made solutions from the community.",
        },
        remixImprove: {
          title: "Remix & improve",
          description: "Take any creation and customize it for your specific needs.",
        },
        growTogether: {
          title: "Grow together",
          description: "Build reputation, earn from your work, and collaborate.",
        },
      },
    },
    debate: {
      title: "Debate Mode",
      subtitle: "Explore ideas from multiple perspectives",
      startDebate: "Start Debate",
      topic: "Topic to Debate",
      yourStance: "Your Initial Stance",
      perspectives: "Perspectives",
      concludeDebate: "Conclude Debate",
      synthesis: "Synthesis",
      keyTensions: "Key Tensions",
      submitArgument: "Submit Argument",
    },
    footer: {
      description: "The reality executor. Transform thought into outcome.",
      joinWaitlist: "Join the waitlist →",
      productSection: "Product",
      companySection: "Company",
      legalSection: "Legal",
      copyright: "© 2026 Nairi. All rights reserved.",
      links: {
        howItWorks: "How it works",
        capabilities: "Capabilities",
        marketplace: "Marketplace",
        pricing: "Pricing",
        about: "About",
        blog: "Blog",
        careers: "Careers",
        contact: "Contact",
        privacy: "Privacy",
        terms: "Terms",
        security: "Security",
      },
    },
    demoModal: {
      title: "See Nairi in Action",
      description: "Watch how Nairi transforms thoughts into complete creations",
      demoVideoComingSoon: "Demo video coming soon",
      videos: {
        presentations: "Create Presentations",
        websites: "Build Websites",
        reports: "Generate Reports",
      },
    },
    auth: {
      welcomeTitle: "Welcome to Nairi",
      welcomeDescription: "Transform your thoughts into reality",
      signInTab: "Sign In",
      signUpTab: "Sign Up",
      email: "Email",
      password: "Password",
      fullName: "Full Name",
      signInButton: "Sign In",
      createAccountButton: "Create Account",
      signInPlaceholder: "you@example.com",
      signUpPlaceholder: "you@example.com",
      createPasswordPlaceholder: "Create a password",
      fullNamePlaceholder: "John Doe",
      orContinueWith: "Or continue with",
      github: "GitHub",
      google: "Google",
      signInSuccess: "Welcome back to Nairi!",
      signUpSuccess: "Account created! Welcome to Nairi.",
    },
    waitlist: {
      title: "Join the Waitlist",
      description: "Be among the first to experience the future of human-computer interaction.",
      emailLabel: "Email Address",
      emailPlaceholder: "you@example.com",
      earlyAccessBenefits: "Early access benefits:",
      benefits: {
        priorityAccess: "Priority access when we launch",
        extendedLimits: "Extended free limits",
        exclusiveCommunity: "Exclusive community access",
      },
      joinWaitlistButton: "Join Waitlist",
      successTitle: "You're on the list!",
      successMessage: "We'll notify you as soon as Nairi is ready for you.",
      closeButton: "Close",
    },
    limits: {
      title: "Fair access for everyone",
      subtitle: "Nairi uses a transparent limit system. Start creating immediately — and expand your capacity through engagement, not just payment.",
      noPaywall: "No paywall for exploration. Experience Nairi's full capabilities before deciding how deep you want to go.",
      dailyCredits: "Your daily credits",
      creditsUsed: "750 / 1000",
      resetsIn: "Resets in 6 hours",
      methods: {
        watchAndEarn: {
          title: "Watch & earn",
          description: "View short content to expand your daily limits.",
          bonus: "+50 credits/day",
        },
        inviteFriends: {
          title: "Invite friends",
          description: "Bring others to Nairi and receive permanent bonuses.",
          bonus: "+500 credits/invite",
        },
        stayActive: {
          title: "Stay active",
          description: "Regular usage rewards consistency with increased capacity.",
          bonus: "Up to 2x multiplier",
        },
        marketplaceActivity: {
          title: "Marketplace activity",
          description: "Selling and contributing earns additional resources.",
          bonus: "10% of sales",
        },
      },
    },
    security: {
      title: "Power with control",
      subtitle: "Autonomy doesn't mean opacity. You always understand what's happening and retain complete control over critical decisions.",
      features: {
        isolatedExecution: {
          title: "Isolated execution",
          description: "All operations run in secure, sandboxed environments — your data never leaves protected boundaries.",
          details: "Each task runs in its own isolated container with no access to other users' data. Enterprise-grade encryption at rest and in transit.",
        },
        fullTransparency: {
          title: "Full transparency",
          description: "See exactly what Nairi is doing at any moment. Every action is logged and explainable.",
          details: "Real-time activity logs, detailed execution traces, and human-readable explanations for every decision Nairi makes.",
        },
        criticalConfirmation: {
          title: "Critical confirmation",
          description: "Important operations require your explicit approval. You always have the final word.",
          details: "Configurable approval thresholds, two-factor confirmation for sensitive actions, and instant pause capabilities.",
        },
        intelligentRefusal: {
          title: "Intelligent refusal",
          description: "Nairi will refuse requests it deems harmful, ineffective, or contrary to your actual goals.",
          details: "Built-in safety guardrails, ethical boundaries, and proactive protection against misuse or manipulation attempts.",
        },
      },
    },
    login: {
      welcomeBack: "Welcome Back",
      signInTitle: "Sign In",
      signInDescription: "Enter your credentials to access your account",
      email: "Email",
      password: "Password",
      signInButton: "Sign In",
      signingIn: "Signing in...",
      dontHaveAccount: "Don't have an account?",
      signUp: "Sign up",
      backToHome: "Back to home",
      passwordsDontMatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters",
      forgotPassword: "Forgot password?",
    },
    forgotPassword: {
      title: "Reset Password",
      cardTitle: "Forgot your password?",
      cardDescription: "Enter your email and we'll send you a reset link.",
      sendLink: "Send Reset Link",
      sending: "Sending...",
      checkEmail: "Check your email",
      emailSent: "We've sent a password reset link to",
      checkSpam: "Didn't receive the email? Check your spam folder or try again.",
      tryAgain: "Try another email",
      backToLogin: "Back to login",
    },
    resetPassword: {
      title: "Set New Password",
      cardTitle: "Create new password",
      cardDescription: "Enter your new password below.",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      updatePassword: "Update Password",
      updating: "Updating...",
      success: "Password Updated",
      successMessage: "Your password has been successfully updated.",
      continueToLogin: "Continue to Login",
    },
    signUp: {
      createAccount: "Create Account",
      signUpTitle: "Sign Up",
      signUpDescription: "Create a new account to get started",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      createAccountButton: "Create Account",
      creatingAccount: "Creating account...",
      alreadyHaveAccount: "Already have an account?",
      signIn: "Sign in",
      backToHome: "Back to home",
      passwordsDontMatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters",
      invalidEmailFormat: "Please enter a valid email address",
      emailAlreadyInUse: "This email is already registered. Please sign in instead.",
      emailServiceError: "We're having trouble verifying this email address. Please try again or contact support.",
    },
  future: {
  horizon: "The horizon",
      title: "This is only the beginning",
      subtitle: "Simulations. Multi-agent collaboration. Predictive execution. Nairi evolves with each interaction, continuously expanding what's possible between thought and reality.",
      quote: "This is not a service. This is a new way of interacting with reality.",
      beginJourney: "Begin Your Journey",
      joinWaitlist: "Join Waitlist",
    },
    feedback: {
      helpful: "Helpful",
      notHelpful: "Not helpful",
      reportIssue: "Report Issue",
      thankYou: "Thank you for your feedback",
      errorOccurred: "An error occurred",
      tryAgain: "Try Again",
      somethingWentWrong: "Something went wrong",
      errorDescription: "An unexpected error occurred. You can try again or return home.",
    },
    dashboard: {
      welcome: "Welcome back",
      welcomeDescription: "Here's what's happening with your AI agents today.",
      tokensBalance: "Tokens Balance",
      activeAgents: "Active Agents",
      conversations: "Conversations",
      usageTime: "Usage Time",
      today: "today",
      thisWeek: "This week",
      thisMonth: "This month",
      free: "free",
      quickActions: "Quick Actions",
      quickActionsDesc: "Get started with your AI agents",
      startNewConversation: "Start New Conversation",
      browseMarketplace: "Browse Marketplace",
      upgradePlan: "Upgrade Plan",
      recentConversations: "Recent Conversations",
      recentConversationsDesc: "Your latest AI interactions",
      yourAgents: "Your Agents",
      yourAgentsDesc: "AI agents available for use",
      viewAll: "View All",
      newConversation: "New Conversation",
      searchPlaceholder: "Search agents, conversations, creations...",
      plan: "Plan",
      workspace: "Workspace",
      builder: "Builder",
      activity: "Activity",
      executionTraces: "Execution Traces",
      notifications: "Notifications",
      creditsRewards: "Credits & Rewards",
    },
  },

  ru: {
    common: {
      loading: "Загрузка...",
      error: "Ошибка",
      save: "Сохранить",
      cancel: "Отмена",
      confirm: "Подтвердить",
      delete: "Удалить",
      edit: "Редактировать",
      create: "Создать",
      search: "Поиск",
      back: "Назад",
      next: "Далее",
      previous: "Предыдущий",
      submit: "Отправить",
      close: "Закрыть",
      yes: "Да",
      no: "Нет",
      or: "или",
      and: "и",
      signIn: "Войти",
      signUp: "Регистрация",
      signOut: "Выйти",
      getStarted: "Начать",
      skipToMainContent: "Перейти к основному содержимому",
      openNavigationMenu: "Открыть меню навигации",
      closeNavigation: "Закрыть навигацию",
      openNavigationHub: "Открыть навигационный центр",
      home: "Главная",
    },
    nav: {
      howItWorks: "Как это работает",
      capabilities: "Возможности",
      marketplace: "Маркетплейс",
      security: "Безопасность",
      dashboard: "Панель управления",
      chat: "ИИ Чат",
      learn: "Nairi Обучение",
      flow: "Nairi Поток",
      knowledge: "Граф знаний",
      debate: "Режим дебатов",
      billing: "Оплата",
      settings: "Настройки",
      builder: "Конструктор",
      docs: "Документация",
      discover: "Обзор",
      community: "Сообщество",
      profile: "Профиль",
      website: "Сайт",
      slides: "Слайды",
      simulate: "Симуляция",
      creations: "Творения",
      traces: "Трассировки",
      earn: "Заработок",
      projects: "Проекты",
      people: "Люди",
      companies: "Компании",
      custom: "Своё",
      logout: "Выйти",
      activity: "Активность",
      workspace: "Рабочее пространство",
      notifications: "Уведомления",
      credits: "Кредиты",
    },
    hero: {
      badge: "Будущее взаимодействия человека и компьютера",
      title: "Одна мысль.",
      subtitle: "Полная реальность.",
      tagline: "Наири — это не помощник. Это исполнитель реальности. Выразите свое намерение — получите готовый результат. Без шагов. Без обучения. Просто результат.",
      cta: "Начать создавать",
      secondaryCta: "Смотреть демо",
      interfaceTitle: "Интерфейс Наири",
      typingText: "Создать презентацию о возобновляемой энергии для завтрашней встречи",
      responseText: "Ваша презентация готова. 12 слайдов, охватывающих:",
      responseItems: {
        item1: "Текущий энергетический ландшафт",
        item2: "Анализ солнечной, ветровой и гидроэнергетики",
        item3: "Дорожная карта реализации",
        item4: "Прогнозы ROI с визуализацией данных",
      },
      downloadButton: "Скачать",
      editButton: "Редактировать",
    },
    chat: {
      title: "ИИ Чат",
      placeholder: "Введите сообщение...",
      sendMessage: "Отправить",
      newConversation: "Новый разговор",
      conversations: "Разговоры",
      modes: {
        default: "Чат",
        defaultDesc: "Общение",
        debate: "Дебаты",
        debateDesc: "Исследуйте разные точки зрения",
        reasoning: "Рассуждение",
        reasoningDesc: "Пошаговый анализ",
        tutor: "Репетитор",
        tutorDesc: "Обучение с помощью",
        creator: "Творчество",
        creatorDesc: "Творческая помощь",
      },
      confidence: {
        high: "Высокая уверенность",
        moderate: "Умеренная уверенность",
        low: "Низкая уверенность",
        explanation: "Уверенность ИИ в этом ответе",
      },
      explainWhy: {
        button: "Объяснить почему",
        title: "Понимание этого ответа",
        reasoning: "Процесс рассуждения",
        sources: "Информация об источниках",
        confidence: "Разбор уверенности",
        alternatives: "Альтернативные точки зрения",
      },
    sidebarNewChat: "Новый чат",
    sidebarCreating: "Создание...",
    sidebarSearchPlaceholder: "Поиск разговоров...",
    sidebarPinned: "Закреплённые",
    sidebarHistory: "История",
    sidebarNoConversations: "Пока нет разговоров",
    sidebarNoMatching: "Нет подходящих разговоров",
    sidebarEdit: "Изменить",
    sidebarDelete: "Удалить",
    sidebarShare: "Поделиться",
    sidebarRenameConversation: "Переименовать разговор",
    sidebarRenameProject: "Переименовать проект",
    sidebarProjectName: "Название проекта",
    sidebarConversationTitle: "Название разговора",
    sidebarBrowseMarketplace: "Маркетплейс",
    sidebarProjects: "Проекты",
    sidebarAll: "Все",
    sidebarNewProject: "Новый проект",
    sidebarNoProjects: "Пока нет проектов",
    sidebarUnpin: "Открепить",
    sidebarPin: "Закрепить",
    sidebarOpenMenu: "Открыть меню чата",
    sidebarCloseMenu: "Закрыть меню чата",
    sidebarMoreOptions: "Ещё",
    sidebarGoToDashboard: "Перейти в панель",
    sidebarStartNewChat: "Начать новый чат",
    builderModeTitle: "Режим конструктора",
    learnModeTitle: "Режим обучения",
    howCanIHelp: "Чем могу помочь?",
    placeholderBuilder: "Опишите, что хотите создать...",
    placeholderLearn: "О чём хотите узнать?",
    placeholderDefault: "Опишите вашу задачу...",
    send: "Отправить",
    voiceInput: "Голосовой ввод",
    attachFile: "Прикрепить файл",
    copyMessage: "Копировать сообщение",
    copied: "Скопировано",
    suggestionContinue: "Продолжить",
    suggestionExplain: "Подробнее",
    suggestionSimplify: "Упростите",
    suggestionExample: "Приведите пример",
  },
  trust: {
    confidenceScore: "Оценка уверенности",
      sourceStrength: "Сила источника",
      peerReviewed: "Рецензировано",
      firstHand: "Из первых рук",
      opinion: "Мнение",
      factual: "Фактическая точность",
      reasoning: "Качество рассуждений",
      sourceQuality: "Качество источника",
      verifyWithSources: "Рекомендуется проверить дополнительными источниками",
      antiEchoChamber: "Альтернативная точка зрения",
      opposingView: "Вот другая перспектива для рассмотрения",
      approvalRequired: "Требуется подтверждение",
      reviewAction: "Проверьте это действие перед продолжением",
    },
    cognitive: {
      fatigueDetected: "Обнаружена усталость",
      takeBreak: "Рекомендуем сделать перерыв",
      overloadWarning: "Информационная перегрузка",
      slowingDown: "Давайте замедлимся и сосредоточимся на одной концепции",
      attentionBudget: "Бюджет внимания",
      whyDoingThis: "Зачем вы это делаете?",
      purposeCheck: "Убедимся, что это соответствует вашим целям",
      goalAlignment: "Проверка соответствия целям",
    },
    learn: {
      title: "Nairi Обучение",
      subtitle: "Ваш персонализированный путь обучения",
      skillTree: "Дерево навыков",
      courses: "Курсы",
      learningPaths: "Пути обучения",
      mySkills: "Мои навыки",
      totalXP: "Всего XP",
      completed: "Завершено",
      streak: "Текущая серия",
      skillsMastered: "Освоено навыков",
      continueWhere: "Продолжить с того места",
      productiveStruggle: "Попробуйте сами",
      tryYourself: "Прежде чем дать ответ, попробуйте разобраться сами",
      errorMemory: "Мы заметили, что у вас были трудности с этим ранее",
      revisitTopic: "Давайте подойдем к этому по-другому",
    },
    marketplace: {
      title: "Маркетплейс ИИ-агентов",
      subtitle: "Откройте и разблокируйте мощных ИИ-агентов",
      featured: "Рекомендуемые агенты",
      allAgents: "Все агенты",
      free: "Бесплатно",
      getAgent: "Получить агента",
      useAgent: "Использовать",
      createAgent: "Создать агента",
      sellAgent: "Продать агента",
      creatorEconomy: "Экономика создателей",
      earnings: "Заработок",
      sales: "Продажи",
      rating: "Рейтинг",
      reviews: "Отзывы",
      publish: "Опубликовать",
      draft: "Черновик",
    },
    settings: {
      title: "Настройки",
      subtitle: "Управление аккаунтом и настройками ИИ",
      profile: "Профиль",
      preferences: "Предпочтения",
      aiGovernance: "Управление ИИ",
      behaviorSliders: "Управление поведением",
      strictness: "Строгость",
      creativity: "Креативность",
      assertiveness: "Настойчивость",
      memoryPermissions: "Разрешения памяти",
      whatToRemember: "Что ИИ может запоминать",
      howLong: "На какой срок",
      whichContexts: "В каких контекстах",
      dataRetention: "Хранение данных",
      exportData: "Экспорт данных",
      deleteData: "Удалить данные",
    },
    capabilities: {
      title: "Создавайте всё",
      subtitle: "Всё, что вы можете представить, Наири может воплотить. Не шаблоны — оригинальные творения, адаптированные под ваше намерение.",
      comingSoon: "Скоро",
      examplesLabel: "Примеры:",
      items: {
        textFormats: {
          title: "Любой текстовый формат",
          description: "Эссе, отчёты, сценарии, электронные письма, юридические документы — написано, отформатировано и отполировано.",
          examples: ["Бизнес-предложения", "Юридические контракты", "Маркетинговые копии"],
        },
        presentations: {
          title: "Презентации",
          description: "Полные наборы слайдов с визуалами, данными и убедительными нарративами.",
          examples: ["Питч-дэки", "Учебные материалы", "Конференц-доклады"],
        },
        websites: {
          title: "Веб-сайты и интерфейсы",
          description: "Полные цифровые опыты, разработанные, построенные и готовые к развертыванию.",
          examples: ["Целевые страницы", "Веб-приложения", "Панели управления"],
        },
        visuals: {
          title: "Визуальные концепции",
          description: "Изображения, иллюстрации и системы дизайна, соответствующие вашему видению.",
          examples: ["Брендинг", "Социальные графики", "Макеты продуктов"],
        },
        games: {
          title: "Игры",
          description: "Интерактивный опыт и игровые концепции.",
          examples: ["Браузерные игры", "Прототипы", "Игровой дизайн"],
        },
        ideas: {
          title: "Идеи и стратегии",
          description: "Бизнес-планы, маркетинговые стратегии, творческие концепции — полностью разработанные.",
          examples: ["Планы выхода на рынок", "Календари контента", "Стратегии роста"],
        },
        simulations: {
          title: "Симуляции",
          description: "Моделируйте сценарии, тестируйте гипотезы, исследуйте возможности.",
          examples: ["Рыночные симуляции", "A/B тестирование", "Прогнозные модели"],
        },
        more: {
          title: "И многое другое...",
          description: "Возможности Наири расширяются непрерывно с каждым взаимодействием.",
          examples: ["Пользовательские рабочие процессы", "Интеграции", "Автоматизации"],
        },
      },
    },
    howItWorks: {
      title: "От мысли к реальности",
      subtitle: "Наири устраняет разрыв между вашим намерением и результатом. Без обучения. Без процесса. Только результаты.",
      steps: {
        speakMind: {
          title: "Выразите мысль",
          description: "Выразите свое намерение на естественном языке. Без конкретных команд, без синтаксиса — просто ваша мысль.",
        },
        understands: {
          title: "Наири понимает",
          description: "Система анализирует ваше намерение, идентифицирует скрытую цель и определяет оптимальный подход.",
        },
        execution: {
          title: "Автономное выполнение",
          description: "Наири планирует, выполняет и проверяет — обрабатывая каждый шаг без вашего участия.",
        },
        receiveResult: {
          title: "Получите результат",
          description: "Получите готовый продукт, а не инструкции. Готово к использованию, обмену или дальнейшей разработке.",
        },
      },
    },
    marketplaceSection: {
      title: "Экосистема творчества",
      subtitle: "Nairi Marketplace — это место, где человеческое творчество встречается с интеллектуальным исполнением. Поделитесь тем, что вы создали, монетизируйте свои идеи и используйте коллективный интеллект сообщества.",
      trendingCreations: "Популярные творения",
      thisWeek: "На этой неделе",
      exploreMarketplace: "Исследовать Маркетплейс",
      features: {
        sellCreations: {
          title: "Продавайте свои творения",
          description: "Все, что вы создаете с помощью Nairi, можно разместить на маркетплейсе.",
        },
        discoverAcquire: {
          title: "Откройте и приобретите",
          description: "Просматривайте тысячи готовых решений от сообщества.",
        },
        remixImprove: {
          title: "Ремиксируйте и улучшайте",
          description: "Берите любое творение и настраивайте его под свои конкретные нужды.",
        },
        growTogether: {
          title: "Расти вместе",
          description: "Строите репутацию, зарабатывайте на своей работе и сотрудничайте.",
        },
      },
    },
    debate: {
      title: "Режим дебатов",
      subtitle: "Исследуйте идеи с разных точек зрения",
      startDebate: "Начать дебаты",
      topic: "Тема для дебатов",
      yourStance: "Ваша позиция",
      perspectives: "Точки зрения",
      concludeDebate: "Завершить дебаты",
      synthesis: "Синтез",
      keyTensions: "Ключевые противоречия",
      submitArgument: "Отправить аргумент",
    },
    footer: {
      description: "Исполнитель реальности. Преобразуйте мысль в результат.",
      joinWaitlist: "Присоединиться к списку ожидания →",
      productSection: "Продукт",
      companySection: "Компания",
      legalSection: "Юридическая информация",
      copyright: "© 2026 Nairi. Все права защищены.",
      links: {
        howItWorks: "Как это работает",
        capabilities: "Возможности",
        marketplace: "Маркетплейс",
        pricing: "Цены",
        about: "О нас",
        blog: "Блог",
        careers: "Карьера",
        contact: "Контакты",
        privacy: "Конфиденциальность",
        terms: "Условия",
        security: "Безопасность",
      },
    },
    demoModal: {
      title: "Посмотреть Nairi в действии",
      description: "Посмотрите, как Nairi превращает мысли в полные творения",
      demoVideoComingSoon: "Демо видео скоро",
      videos: {
        presentations: "Создавать презентации",
        websites: "Создавать сайты",
        reports: "Генерировать отчеты",
      },
    },
    auth: {
      welcomeTitle: "Добро пожаловать в Nairi",
      welcomeDescription: "Преобразите свои мысли в реальность",
      signInTab: "Войти",
      signUpTab: "Регистрация",
      email: "Email",
      password: "Пароль",
      fullName: "Полное имя",
      signInButton: "Войти",
      createAccountButton: "Создать аккаунт",
      signInPlaceholder: "you@example.com",
      signUpPlaceholder: "you@example.com",
      createPasswordPlaceholder: "Создать пароль",
      fullNamePlaceholder: "Иван Петров",
      orContinueWith: "Или продолжить с",
      github: "GitHub",
      google: "Google",
      signInSuccess: "Добро пожаловать обратно в Nairi!",
      signUpSuccess: "Аккаунт создан! Добро пожаловать в Nairi.",
    },
    waitlist: {
      title: "Присоединиться к списку ожидания",
      description: "Будьте среди первых, кто испытает будущее взаимодействия человека и компьютера.",
      emailLabel: "Email адрес",
      emailPlaceholder: "you@example.com",
      earlyAccessBenefits: "Преимущества раннего доступа:",
      benefits: {
        priorityAccess: "Приоритетный доступ при запуске",
        extendedLimits: "Расширенные бесплатные лимиты",
        exclusiveCommunity: "Доступ к эксклюзивному сообществу",
      },
      joinWaitlistButton: "Присоединиться к списку ожидания",
      successTitle: "Вы в списке!",
      successMessage: "Мы уведомим вас, как только Nairi будет готов для вас.",
      closeButton: "Закрыть",
    },
    limits: {
      title: "Честный доступ для всех",
      subtitle: "Nairi использует прозрачную систему лимитов. Начинайте создавать немедленно — и расширяйте свою емкость через взаимодействие, а не только через оплату.",
      noPaywall: "Нет платежного барьера для исследования. Опытите полные возможности Nairi перед тем, как решить, насколько глубоко вы хотите погрузиться.",
      dailyCredits: "Ваши ежедневные кредиты",
      creditsUsed: "750 / 1000",
      resetsIn: "Сброс через 6 часов",
      methods: {
        watchAndEarn: {
          title: "Смотреть и зарабатывать",
          description: "Просматривайте короткий контент, чтобы расширить свои ежедневные лимиты.",
          bonus: "+50 кредитов/день",
        },
        inviteFriends: {
          title: "Приглашать друзей",
          description: "Приводите других в Nairi и получайте постоянные бонусы.",
          bonus: "+500 кредитов/приглашение",
        },
        stayActive: {
          title: "Быть активным",
          description: "Регулярное использование вознаграждает последовательность увеличенной емкостью.",
          bonus: "До 2x множителя",
        },
        marketplaceActivity: {
          title: "Активность на маркетплейсе",
          description: "Продажа и вклад зарабатывают дополнительные ресурсы.",
          bonus: "10% от продаж",
        },
      },
    },
    security: {
      title: "Сила с контролем",
      subtitle: "Автономия не означает непрозрачность. Вы всегда понимаете, что происходит и сохраняете полный контроль над критическими решениями.",
      features: {
        isolatedExecution: {
          title: "Изолированное выполнение",
          description: "Все операции выполняются в безопасных, изолированных средах — ваши данные никогда не покидают защищенные границы.",
          details: "Каждая задача выполняется в своем собственном изолированном контейнере без доступа к данным других пользователей. Шифрование корпоративного уровня при хранении и передаче.",
        },
        fullTransparency: {
          title: "Полная прозрачность",
          description: "Видите точно, что делает Nairi в любой момент. Каждое действие регистрируется и объяснимо.",
          details: "Журналы активности в реальном времени, детальные трассировки выполнения и читаемые человеком объяснения для каждого решения, принимаемого Nairi.",
        },
        criticalConfirmation: {
          title: "Критическое подтверждение",
          description: "Важные операции требуют вашего явного одобрения. Вы всегда имеете последнее слово.",
          details: "Настраиваемые пороги одобрения, двухфакторное подтверждение для чувствительных действий и мгновенные возможности паузы.",
        },
        intelligentRefusal: {
          title: "Интеллектуальный отказ",
          description: "Nairi будет отказывать от запросов, которые он считает вредными, неэффективными или противоречащими вашим действительным целям.",
          details: "Встроенные меры безопасности, этические границы и упреждающая защита от неправильного использования или манипуляции.",
        },
      },
    },
    login: {
      welcomeBack: "Добро пожаловать обратно",
      signInTitle: "Войти",
      signInDescription: "Введите свои учетные данные для доступа к аккаунту",
      email: "Email",
      password: "Пароль",
      signInButton: "Войти",
      signingIn: "Вход...",
      dontHaveAccount: "Нет аккаунта?",
      signUp: "Регистрация",
      backToHome: "Вернуться на главную",
      passwordsDontMatch: "Пароли не совпадают",
      passwordTooShort: "Пароль должен содержать минимум 6 символов",
      forgotPassword: "Забыли пароль?",
    },
    forgotPassword: {
      title: "Сброс пароля",
      cardTitle: "Забыли пароль?",
      cardDescription: "Введите ваш email, и мы отправим вам ссылку для сброса.",
      sendLink: "Отправить ссылку",
      sending: "Отправка...",
      checkEmail: "Проверьте вашу почту",
      emailSent: "Мы отправили ссылку для сброса пароля на",
      checkSpam: "Не получили письмо? Проверьте папку спам или попробуйте снова.",
      tryAgain: "Попробовать другой email",
      backToLogin: "Вернуться к входу",
    },
    resetPassword: {
      title: "Новый пароль",
      cardTitle: "Создать новый пароль",
      cardDescription: "Введите ваш новый пароль ниже.",
      newPassword: "Новый пароль",
      confirmPassword: "Подтвердите новый пароль",
      updatePassword: "Обновить пароль",
      updating: "Обновление...",
      success: "Пароль обновлен",
      successMessage: "Ваш пароль был успешно обновлен.",
      continueToLogin: "Перейти к входу",
    },
    signUp: {
      createAccount: "Создать аккаунт",
      signUpTitle: "Регистрация",
      signUpDescription: "Создайте новый аккаунт, чтобы начать",
      fullName: "Полное имя",
      email: "Email",
      password: "Пароль",
      confirmPassword: "Подтвердить пароль",
      createAccountButton: "Создать аккаунт",
      creatingAccount: "Создание аккаунта...",
      alreadyHaveAccount: "Уже есть аккаунт?",
      signIn: "Войти",
      backToHome: "Вернуться на главную",
      passwordsDontMatch: "Пароли не совпадают",
      passwordTooShort: "Пароль должен содержать минимум 6 символов",
      invalidEmailFormat: "Пожалуйста, введите действительный адрес электронной почты",
      emailAlreadyInUse: "Этот email уже зарегистрирован. Пожалуйста, войдите.",
      emailServiceError: "Не удалось проверить email. Попробуйте снова или свяжитесь с поддержкой.",
    },
    future: {
      horizon: "Горизонт",
      title: "Это только начало",
      subtitle: "Симуляции. Многоагентное сотрудничество. Предиктивное выполнение. Nairi эволюционирует с каждым взаимодействием, непрерывно расширяя то, что возможно между мыслью и реальностью.",
      quote: "Это не сервис. Это новый способ взаимодействия с реальностью.",
      beginJourney: "Начать свое путешествие",
      joinWaitlist: "Присоединиться к списку ожидания",
    },
    feedback: {
      helpful: "Полезно",
      notHelpful: "Не полезно",
      reportIssue: "Сообщить о проблеме",
      thankYou: "Спасибо за отзыв",
      errorOccurred: "Произошла ошибка",
      tryAgain: "Попробовать снова",
      somethingWentWrong: "Что-то пошло не так",
      errorDescription: "Произошла непредвиденная ошибка. Вы можете попробовать снова или вернуться на главную.",
    },
    dashboard: {
      welcome: "Добро пожаловать обратно",
      welcomeDescription: "Вот что происходит с вашими ИИ агентами сегодня.",
      tokensBalance: "Баланс токенов",
      activeAgents: "Активные агенты",
      conversations: "Разговоры",
      usageTime: "Время использования",
      today: "сегодня",
      thisWeek: "На этой неделе",
      thisMonth: "В этом месяце",
      free: "бесплатно",
      quickActions: "Быстрые действия",
      quickActionsDesc: "Начните работу с вашими ИИ агентами",
      startNewConversation: "Начать новый разговор",
      browseMarketplace: "Просмотреть маркетплейс",
      upgradePlan: "Улучшить план",
      recentConversations: "Последние разговоры",
      recentConversationsDesc: "Ваши последние взаимодействия с ИИ",
      yourAgents: "Ваши агенты",
      yourAgentsDesc: "ИИ агенты доступные для использования",
      viewAll: "Посмотреть все",
      newConversation: "Новый разговор",
      searchPlaceholder: "Поиск агентов, разговоров, творений...",
      plan: "План",
      workspace: "Рабочее пространство",
      builder: "Конструктор",
      activity: "Активность",
      executionTraces: "Трассировка выполнения",
      notifications: "Уведомления",
      creditsRewards: "Кредиты и награды",
    },
  },

  hy: {
    common: {
      loading: "Բեռնում...",
      error: "Սխալ",
      save: "Պահպանել",
      cancel: "Չեղարկել",
      confirm: "Հաստատել",
      delete: "Ջնջել",
      edit: "Խմբագրել",
      create: "Ստեղծել",
      search: "Որոնել",
      back: "Հետ",
      next: "Հաջորդ",
      previous: "Նախկին",
      submit: "Ուղարկել",
      close: "Փակել",
      yes: "Այո",
      no: "Ոչ",
      or: "կամ",
      and: "և",
      signIn: "Մուտք",
      signUp: "Գրանցում",
      signOut: "Ելք",
      getStarted: "Սկսել",
      skipToMainContent: "Անցնել հիմնական բովանդակությանը",
      openNavigationMenu: "Բացել նավիգացիայի մենյուն",
      closeNavigation: "Փակել նավիգացիան",
      openNavigationHub: "Բացել նավիգացիայի կենտրոնը",
      home: "Գլխավոր",
    },
    nav: {
      howItWorks: "Ինչպես է աշխատում",
      capabilities: "Հնարավորություններ",
      marketplace: "Շուկա",
      security: "Անվտանգություն",
      dashboard: "Վահանակ",
      chat: "ԱI Զրույց",
      learn: "Nairi Սովորում",
      flow: "Nairi Հոսք",
      knowledge: "Գիտելիքների գրաֆ",
      debate: "Վիճաբանության ռեժիմ",
      billing: "Վճարում",
      settings: "Կարգավորումներ",
      builder: "Կառուցող",
      docs: "Փաստաթղթեր",
      discover: "Բացահայտել",
      community: "Համայնք",
      profile: "Պրոֆիլ",
      website: "Կայք",
      slides: "Սլայդներ",
      simulate: "Սիմուլյացիա",
      creations: "Ստեղծագործություններ",
      traces: "Հետքեր",
      earn: "Վաստակել",
      projects: "Նախագծեր",
      people: "Մարդիկ",
      companies: "Ընկերություններ",
      custom: "Սեփական",
      logout: "Ելք",
      activity: "Գործունեություն",
      workspace: "Աշխատատեղ",
      notifications: "Ծանուցումներ",
      credits: "Կրեդիտներ",
    },
    hero: {
      badge: "Մարդու և համակարգչի փոխազդեցության ապագան",
      title: "Մեկ միտք.",
      subtitle: "Ամբողջական իրականություն.",
      tagline: "Նաիրին օգնական չէ. Դա իրականության իրագործող է. Արտահայտեք ձեր մտադրությունը — ստացեք պատրաստ արդյունքը. Առանց քայլերի. Առանց ուսուցման. Միայն արդյունք.",
      cta: "Սկսել ստեղծել",
      secondaryCta: "Դիտել տեսահոլովակ",
      interfaceTitle: "Նաիրի ինտերֆեյս",
      typingText: "Ստեղծել ներկայացում վերականգնվող էներգիայի մասին վաղվա հանդիպման համար",
      responseText: "Ձեր ներկայացումը պատրաստ է. 12 սլայդ՝ ընդգրկելով.",
      responseItems: {
        item1: "Ընթացիկ էներգետիկ լանդշաֆտ",
        item2: "Արևային, քամու և հիդրոէներգիայի վերլուծություն",
        item3: "Իրագործման ճանապարհային քարտեզ",
        item4: "ROI կանխատեսումներ տվյալների վիզուալիզացիայով",
      },
      downloadButton: "Ներբեռնել",
      editButton: "Խմբագրել",
    },
    chat: {
      title: "ԱI Զրույց",
      placeholder: "Գրեք ձեր հաղորդագրությունը...",
      sendMessage: "Ուղարկել",
      newConversation: "Նոր զրույց",
      conversations: "Զրույցներ",
      modes: {
        default: "Զրույց",
        defaultDesc: " Ընդհանուր զրույց",
        debate: "Վիճաբանություն",
        debateDesc: " Ուսումնասիրեք տարբեր տեսակետներ",
        reasoning: "Մտածելակերպ",
        reasoningDesc: "Քայլ առ քայլ վերլուծություն",
        tutor: "Ուսուցիչ",
        tutorDesc: "Ուսումնասիրեք ուղեցույցով",
        creator: "Ստեղծող",
        creatorDesc: " Ստեղծագործական օգնություն",
      },
      confidence: {
        high: "Բարձր վստահություն",
        moderate: "Չափավոր վստահություն",
        low: "Ցածր վստահություն",
        explanation:
          "ԱI-ի վստահությունը այս պատասխանում",
      },
      explainWhy: {
        button: "Բացատրեք թե ինչու",
        title: "Այս պատասխանի ըմբռնումը",
        reasoning: "Մտածելակերպի գործընթաց",
        sources: "Աղբյուրների տեղեկատվություն",
        confidence: "Վստահության մանրամասներ",
        alternatives: "Այլընտրանքային տեսակետներ",
      },
    sidebarNewChat: "Նոր զրույց",
    sidebarCreating: "Ստեղծվում է...",
    sidebarSearchPlaceholder: "Փնտրել զրույցներ...",
    sidebarPinned: "Ամրացված",
    sidebarHistory: "Պատմություն",
    sidebarNoConversations: "Դեռ զրույցներ չկան",
    sidebarNoMatching: "Համապատասխան զրույցներ չկան",
    sidebarEdit: "Խմբագրել",
    sidebarDelete: "Ջնջել",
    sidebarShare: "Կիսվել",
    sidebarRenameConversation: "Վերանվանել զրույցը",
    sidebarRenameProject: "Վերանվանել նախագիծը",
    sidebarProjectName: "Նախագծի անուն",
    sidebarConversationTitle: "Զրույցի վերնագիր",
    sidebarBrowseMarketplace: "Դիտել շուկան",
    sidebarProjects: "Նախագծեր",
    sidebarAll: "Բոլորը",
    sidebarNewProject: "Նոր նախագիծ",
    sidebarNoProjects: "Դեռ նախագծեր չկան",
    sidebarUnpin: "Ամրացումը հեռացնել",
    sidebarPin: "Ամրացնել",
    sidebarOpenMenu: "Բացել զրույցի մենյու",
    sidebarCloseMenu: "Փակել զրույցի մենյու",
    sidebarMoreOptions: "Լրացուցիչ",
    sidebarGoToDashboard: "Գնալ վահանակ",
    sidebarStartNewChat: "Սկսել նոր զրույց",
    builderModeTitle: "Կառուցողի ռեժիմ",
    learnModeTitle: "Սովորելու ռեժիմ",
    howCanIHelp: "Ինչպե՞ս կարող եմ օգնել:",
    placeholderBuilder: "Նկարագրեք, թե ինչ եք ցանկանում ստեղծել...",
    placeholderLearn: "Ինչի՞ մասին ցանկանում եք սովորել?",
    placeholderDefault: "Նկարագրեք ձեր նպատակը...",
    send: "Ուղարկել",
    voiceInput: "Ձայնային մուտք",
    attachFile: "Կցել ֆայլ",
    copyMessage: "Պատճենել հաղորդագրությունը",
    copied: "Պատճենված",
    suggestionContinue: "Շարունակել",
    suggestionExplain: "Ավելի մանրամասն",
    suggestionSimplify: "Պարզեցնել",
    suggestionExample: "Օրինակ բերել",
  },
  trust: {
    confidenceScore: "Վստահության գնահատական",
      sourceStrength: "Աղբյուրի ուժը",
      peerReviewed: "Գործընկերային վերանայված",
      firstHand: "Առաջին ձեռքից",
      opinion: "Կարծիք",
      factual: "Համապատասխանություն փաստերին",
      reasoning: "Մտածելակերպի որակ",
      sourceQuality: "Աղբյուրի որակ",
      verifyWithSources: "Խորհուրդ է տրվում ստուգել լրացուցիչ աղբյուրներով",
      antiEchoChamber: "Այլընտրանքային տեսակետ",
      opposingView: "Ահա մեկ այլ տեսակետ, որը կարելի է հաշվի առնել",
      approvalRequired: "Պահանջվում է հաստատում",
      reviewAction: "Ստուգեք այս գործողությունը նախքան շարունակելը",
    },
    cognitive: {
      fatigueDetected: "Հոգնածություն հայտնաբերված է",
      takeBreak: "Հաշվի առեք կարճ ընդմիջում անելը",
      overloadWarning: "Տեղեկատվական ծանրաբեռնվածություն",
      slowingDown: "Դանդաղենք և կենտրոնանանք մեկ հայեցակարգի վրա",
      attentionBudget: "Ուշադրության բյուջե",
      whyDoingThis: "Ինչու եք դա անում?",
      purposeCheck: "Համոզվենք, որ դա համապատասխանում է ձեր նպատակներին",
      goalAlignment: "Նպատակների համապատասխանության ստուգում",
    },
    learn: {
      title: "Nairi Սովորում",
      subtitle: "Ձեր անհատական ուսման ճանապարհը",
      skillTree: "Հմտությունների ծառ",
      courses: "Դասընթացներ",
      learningPaths: "Ուսման ուղիներ",
      mySkills: "Իմ հմտությունները",
      totalXP: "Ընդամենը XP",
      completed: "Ավարտված",
      streak: "Ընթացիկ շարք",
      skillsMastered: "Օվլացած հմտություններ",
      continueWhere: "Շարունակեք այնտեղից, որտեղ դադարեցրել եք",
      productiveStruggle: "Փորձեք ինքներդ",
      tryYourself: "Նախքան պատասխան տալը, փորձեք ինքներդ հասկանալ",
      errorMemory: "Մենք նկատել ենք, որ նախկինում դժվարություններ եք ունեցել դրա հետ",
      revisitTopic: "Հասնենք դրան այլ կերպ",
    },
    marketplace: {
      title: "ԱI գործակալների շուկա",
      subtitle: "Բացահայտեք և ապաշրջակազմեք հզոր ԱI գործակալներ",
      featured: "Ընտրված գործակալներ",
      allAgents: "Բոլոր գործակալները",
      free: "Անվճար",
      getAgent: "Ստանալ գործակալ",
      useAgent: "Օգտագործել",
      createAgent: "Ստեղծել գործակալ",
      sellAgent: "Վաճառել ձեր գործակալը",
      creatorEconomy: "Ստեղծողների տնտեսություն",
      earnings: "Եկամուտներ",
      sales: "Վաճառքներ",
      rating: "Վարկանիշ",
      reviews: "Կարծիքներ",
      publish: "Հրապարակել",
      draft: "Սևագրություն",
    },
    settings: {
      title: "Կարգավորումներ",
      subtitle: "Կառավարեք ձեր հաշիվը և ԱI նախապատվությունները",
      profile: "Պրոֆիլ",
      preferences: "Նախապատվություններ",
      aiGovernance: "ԱI կառավարում",
      behaviorSliders: "Վարքագծի կառավարում",
      strictness: "Խստություն",
      creativity: "Ստեղծագործականություն",
      assertiveness: "Հաստատակամություն",
      memoryPermissions: "Հիշողության թույլտվություններ",
      whatToRemember: "Ինչ կարող է ԱI հիշել",
      howLong: "Ինչքան ժամանակով",
      whichContexts: "Ինչ համատեքսներում",
      dataRetention: "Տվյալների պահպանում",
      exportData: "Արտահանել տվյալները",
      deleteData: "Ջնջել տվյալները",
    },
    capabilities: {
      title: "Ստեղծեք ամեն ինչ",
      subtitle: "Ամեն ինչ, ինչ կարող եք պատկերացնել, Նաիրին կարող է իրագործել. Ոչ ձևանմուշներ — ձեր մտադրությանը հարմարեցված օրիգինալ ստեղծագործություններ.",
      comingSoon: "Շուտով",
      examplesLabel: "Օրինակներ.",
      items: {
        textFormats: {
          title: "Ցանկացած տեքստային ձևաչափ",
          description: "Էսսեներ, զեկույցներ, սցենարներ, էլեկտրոնային նամակներ, իրավական փաստաթղթեր — գրված, ձևաչափված և քսված.",
          examples: ["Բիզնես առաջարկություններ", "Իրավական պայմանագրեր", "Մարկետինգային կոպիներ"],
        },
        presentations: {
          title: "Ներկայացումներ",
          description: "Լրիվ սլայդերի փաթեթներ վիզուալներով, տվյալներով և համոզիչ պատմություններով.",
          examples: ["Պիտչ դեկներ", "Ուսումնական նյութեր", "Կոնֆերանսի զեկույցներ"],
        },
        websites: {
          title: "Վեբ կայքեր և ինտերֆեյսներ",
          description: "Լրիվ թվային փորձառություններ, որոնք նախագծված, կառուցված և պատրաստ են տեղակայման համար.",
          examples: ["Թիրախային էջեր", "Վեբ հավելվածներ", "Վահանակներ"],
        },
        visuals: {
          title: "Վիզուալ կոնցեպտներ",
          description: "Պատկերներ, իլուստրացիաներ և դիզայնի համակարգեր, որոնք համապատասխանում են ձեր տեսլականին.",
          examples: ["Բրենդինգ", "Սոցիալական գրաֆիկա", "Արտադրանքի մակետներ"],
        },
        games: {
          title: "Խաղեր",
          description: "Ինտերակտիվ փորձառություններ և խաղային կոնցեպտներ.",
          examples: ["Բրաուզերային խաղեր", "Պրոտոտիպներ", "Խաղի դիզայն"],
        },
        ideas: {
          title: "Գաղափարներ և ռազմավարություններ",
          description: "Բիզնես պլաններ, մարկետինգի ռազմավարություններ, ստեղծագործական կոնցեպտներ — լրիվ մշակված.",
          examples: ["Շուկայի դուրս գալու պլաններ", "Կոնտենտի օրացույցներ", "Աճի ռազմավարություններ"],
        },
        simulations: {
          title: "Սիմուլյացիաներ",
          description: "Մոլորակեք սցենարներ, ստուգեք հիպոթեզներ, ուսումնասիրեք հնարավորություններ.",
          examples: ["Շուկային սիմուլյացիաներ", "A/B ստուգում", "Կանխատեսական մոլորակներ"],
        },
        more: {
          title: "Եվ ավելին...",
          description: "Նաիրիի հնարավորությունները շարունակաբար ընդլայնվում են յուրաքանչյուր փոխազդեցության հետ.",
          examples: ["Հատուկ աշխատանքային հոսքեր", "Ինտեգրացիաներ", "Ավտոմատացումներ"],
        },
      },
    },
    howItWorks: {
      title: "Մտքից դեպի իրականություն",
      subtitle: "Նաիրին վերացնում է ձեր մտադրության և արդյունքի միջև բացը. Առանց ուսուցման. Առանց գործընթացի. Միայն արդյունքներ.",
      steps: {
        speakMind: {
          title: "Արտահայտեք ձեր միտքը",
          description: "Արտահայտեք ձեր մտադրությունը բնական լեզվով. Առանց հատուկ հրամանների, առանց շարահյուսության — միայն ձեր միտքը.",
        },
        understands: {
          title: "Նաիրին հասկանում է",
          description: "Համակարգը վերլուծում է ձեր մտադրությունը, նույնականացնում է թաքնված նպատակը և որոշում է օպտիմալ մոտեցումը.",
        },
        execution: {
          title: "Ավտոնոմ կատարում",
          description: "Նաիրին պլանավորում է, կատարում և ստուգում — մշակելով յուրաքանչյուր քայլ առանց ձեր մասնակցության.",
        },
        receiveResult: {
          title: "Ստացեք արդյունքը",
          description: "Ստացեք պատրաստ ապրանքը, ոչ թե հրահանգները. Պատրաստ օգտագործման, փոխանակման կամ հետագա մշակման համար.",
        },
      },
    },
    marketplaceSection: {
      title: "Ստեղծագործության էկոհամակարգ",
      subtitle: "Նաիրի շուկան այն վայրն է, որտեղ մարդկային ստեղծագործականությունը հանդիպում է ինտելեկտուալ իրագործմանը. Կիսվեք ձեր ստեղծածով, մոնետիզացրեք ձեր գաղափարները և օգտագործեք համայնքի կոլեկտիվ ինտելեկտը.",
      trendingCreations: "Հանրաճանաչ ստեղծագործություններ",
      thisWeek: "Այս շաբաթ",
      exploreMarketplace: "Ուսումնասիրել շուկան",
      features: {
        sellCreations: {
          title: "Վաճառեք ձեր ստեղծագործությունները",
          description: "Ամեն ինչ, ինչ դուք ստեղծում եք Նաիրիով, կարող է տեղադրվել շուկայով.",
        },
        discoverAcquire: {
          title: "Բացահայտեք և ձեռք բերեք",
          description: "Դիտեք հազարավոր պատրաստ լուծումներ համայնքից.",
        },
        remixImprove: {
          title: "Ռեմիքսեք և բարելավեք",
          description: "Վերցրեք ցանկացած ստեղծագործություն և հարմարեցրեք այն ձեր կոնկրետ կարիքներին.",
        },
        growTogether: {
          title: "Աճեք միասին",
          description: "Կառուցեք համբավ, վաստակեք ձեր աշխատանքից և համագործակցեք.",
        },
      },
    },
    debate: {
      title: "Վիճաբանության ռեժիմ",
      subtitle: "Ուսումնասիրեք գաղափարները տարբեր տեսակետներից",
      startDebate: "Սկսել վիճաբանություն",
      topic: "Վիճաբանության թեմա",
      yourStance: "Ձեր նախնական դիրքորոշումը",
      perspectives: "Տեսակետներ",
      concludeDebate: "Ավարտել վիճաբանությունը",
      synthesis: "Սինթեզ",
      keyTensions: "Բանալի լարվածություններ",
      submitArgument: "Ուղարկել փաստարկ",
    },
    footer: {
      description: "Իրականության իրագործող. Միտքը վերածեք արդյունքի.",
      joinWaitlist: "Միանալ սպասման ցուցակին →",
      productSection: "Արտադրանք",
      companySection: "Ընկերություն",
      legalSection: "Իրավական",
      copyright: "© 2026 Nairi. Բոլոր իրավունքները պաշտպանված են.",
      links: {
        howItWorks: "Ինչպես է աշխատում",
        capabilities: "Հնարավորություններ",
        marketplace: "Շուկա",
        pricing: "Գներ",
        about: "Մեր մասին",
        blog: "Բլոգ",
        careers: "Աշխատանք",
        contact: "Կապ",
        privacy: "Գաղտնիություն",
        terms: "Պայմաններ",
        security: "Անվտանգություն",
      },
    },
    demoModal: {
      title: "Տեսնել Նաիրին գործողության մեջ",
      description: "Տեսեք, թե ինչպես է Նաիրին միտքերը վերածում լրիվ ստեղծագործությունների",
      demoVideoComingSoon: "Դեմո տեսահոլովակը շուտով",
      videos: {
        presentations: "Ստեղծել ներկայացումներ",
        websites: "Ստեղծել կայլեր",
        reports: "Գեներացնել զեկույցներ",
      },
    },
    auth: {
      welcomeTitle: "Բարի գալուստ Նաիրի",
      welcomeDescription: "Վերածեք ձեր միտքերը իրականության",
      signInTab: "Մուտք",
      signUpTab: "Գրանցում",
      email: "Email",
      password: "Գաղտնաբառ",
      fullName: "Ամբողջական անուն",
      signInButton: "Մուտք",
      createAccountButton: "Ստեղծել հաշիվ",
      signInPlaceholder: "you@example.com",
      signUpPlaceholder: "you@example.com",
      createPasswordPlaceholder: "Ստեղծել գաղտնաբառ",
      fullNamePlaceholder: "Հովհաննես Պետրոսյան",
      orContinueWith: "Կամ շարունակել հետևյալով",
      github: "GitHub",
      google: "Google",
      signInSuccess: "Բարի վերադարձ Նաիրի!",
      signUpSuccess: "Հաշիվը ստեղծված է! Բարի գալուստ Նաիրի.",
    },
    waitlist: {
      title: "Միանալ սպասման ցուցակին",
      description: "Եղեք առաջիններից մեկը, ով կփորձի մարդու և համակարգչի փոխազդեցության ապագան.",
      emailLabel: "Email հասցե",
      emailPlaceholder: "you@example.com",
      earlyAccessBenefits: "Արաջին մուտքի առավելություններ.",
      benefits: {
        priorityAccess: "Առաջնահերթ մուտք գործարկման ժամանակ",
        extendedLimits: "Ընդլայնված անվճար սահմանափակումներ",
        exclusiveCommunity: "Մուտք դեպի բացառիկ համայնք",
      },
      joinWaitlistButton: "Միանալ սպասման ցուցակին",
      successTitle: "Դուք ցուցակում եք!",
      successMessage: "Մենք կտեղեկացնենք ձեզ, երբ Նաիրին պատրաստ լինի ձեզ համար.",
      closeButton: "Փակել",
    },
    limits: {
      title: "Հավասար մուտք բոլորի համար",
      subtitle: "Նաիրին օգտագործում է թափանցիկ սահմանափակման համակարգ. Սկսեք ստեղծել անմիջապես — և ընդլայնեք ձեր հզորությունը փոխազդեցության միջոցով, ոչ միայն վճարման միջոցով.",
      noPaywall: "Ոչ վճարային արգելափակում հետազոտության համար. Փորձեք Նաիրիի լրիվ հնարավորությունները նախքան որոշելը, թե որքան խոր եք ուզում մուգնել.",
      dailyCredits: "Ձեր օրական կրեդիտները",
      creditsUsed: "750 / 1000",
      resetsIn: "Վերականգնվում է 6 ժամից",
      methods: {
        watchAndEarn: {
          title: "Դիտել և վաստակել",
          description: "Դիտեք կարճ բովանդակություն՝ ձեր օրական սահմանափակումները ընդլայնելու համար.",
          bonus: "+50 կրեդիտ/օր",
        },
        inviteFriends: {
          title: "Հրավիրել ընկերներին",
          description: "Տանեք ուրիշներին Նաիրի և ստացեք մշտական բոնուսներ.",
          bonus: "+500 կրեդիտ/հրավեր",
        },
        stayActive: {
          title: "Եղեք ակտիվ",
          description: "Ցանկացած օգտագործումը մրցանակավորում է հետևողականությունը՝ մեծացնելով հզորությունը.",
          bonus: "Մինչև 2x բազմապատկիչ",
        },
        marketplaceActivity: {
          title: "Շուկայի ակտիվություն",
          description: "Վաճառքը և ներդրումը վաստակում են լրացուցիչ ռեսուրսներ.",
          bonus: "Վաճառքի 10%-ը",
        },
      },
    },
    security: {
      title: "Ուժը կոնտրոլով",
      subtitle: "Ավտոնոմիան չի նշանակում անթափանցություն. Դուք միշտ գիտեք, թե ինչ է կատարվում և ունեք լիարժեք կոնտրոլ կրիտիկալ որոշումների վրա.",
      features: {
        isolatedExecution: {
          title: "Մեկուսացված կատարում",
          description: "Բոլոր գործողությունները կատարվում են անվտանգ, մեկուսացված միջավայրերում — ձեր տվյալները երբեք չեն լքում պաշտպանված սահմանները.",
          details: "Յուրաքանչյուր առաջադրանք կատարվում է իր սեփական մեկուսացված կոնտեյներում առանց մուտքի մյուս օգտատերերի տվյալներին. Ձեռնարկային մակարդակի կոդավորում հանգստի և փոխանցման ժամանակ.",
        },
        fullTransparency: {
          title: "Լրիվ թափանցիկություն",
          description: "Տեսեք ճշտորեն, թե ինչ է անում Նաիրին ցանկացած պահի. Յուրաքանչյուր գործողություն գրանցված է և բացատրվում է.",
          details: "Ուղիղ ժամանակի գործունեության տեղեկամատյաններ, մանրամասն կատարման գծագրեր և ընթերցելի մարդկային բացատրություններ Նաիրիի կողմից կայացված յուրաքանչյուր որոշման համար.",
        },
        criticalConfirmation: {
          title: "Կրիտիկալ հաստատում",
          description: "Կարևոր գործողություններ պահանջում են ձեր ակնհայտ հաստատումը. Դուք միշտ ունեք վերջնական խոսքը.",
          details: "Կարգավորելի հաստատման շեմեր, երկու գործոնով հաստատում զգայուն գործողությունների համար և անմիջական դադարեցման հնարավորություններ.",
        },
        intelligentRefusal: {
          title: "Ինտելեկտուալ մերժում",
          description: "Նաիրին կմերժի հարցումներ, որոնք նա համարում է վնասակար, անարդյունավետ կամ հականում է ձեր իրական նպատակներին.",
          details: "Ներկառուցված անվտանգության սահմաններ, էթիկական սահմաններ և նախկին պաշտպանություն դեմ չարաշահման կամ մանիպուլյացիայի փորձերի.",
        },
      },
    },
login: {
      welcomeBack: "\u0532\u0561\u0580\u056b \u057e\u0565\u0580\u0561\u0564\u0561\u0580\u0571",
      signInTitle: "\u0544\u0578\u0582\u057f\u0584",
      signInDescription: "\u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u0584 \u0571\u0565\u0580 \u0570\u0561\u0577\u056b\u057e",
      email: "Email",
      password: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c",
      signInButton: "\u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u056c",
      signingIn: "\u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0578\u0582\u0574...",
      dontHaveAccount: "\u0549\u0578\u0582\u0576\u0565\u055e\u0584 \u0570\u0561\u0577\u056b\u057e",
      signUp: "\u0533\u0580\u0561\u0576\u0581\u057e\u0565\u056c",
      backToHome: "\u054e\u0565\u0580\u0561\u0564\u0561\u057c\u0576\u0561\u056c \u0563\u056c\u056d\u0561\u057e\u0578\u0580 \u0567\u057b",
      passwordsDontMatch: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0565\u0580\u0568 \u0579\u0565\u0576 \u0570\u0561\u0574\u0561\u057a\u0561\u057f\u0561\u057d\u056d\u0561\u0576\u0578\u0582\u0574",
      passwordTooShort: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568 \u057a\u0565\u057f\u0584 \u0567 \u056c\u056b\u0576\u056b \u0561\u057c\u0576\u057e\u0561\u0566\u0576 6 \u0576\u056b\u0577",
      forgotPassword: "\u0544\u0578\u057c\u0561\u0581\u0565\u055e\u056c \u0565\u0584 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568",
    },
    forgotPassword: {
      title: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u056b \u057e\u0565\u0580\u0561\u056f\u0561\u0576\u0563\u0576\u0578\u0582\u0574",
      cardTitle: "\u0544\u0578\u057c\u0561\u0581\u0565\u055e\u056c \u0565\u0584 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568",
      cardDescription: "\u0544\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 \u0571\u0565\u0580 email-\u0568, \u0587 \u0574\u0565\u0576\u0584 \u056f\u0578\u0582\u0572\u0561\u0580\u056f\u0565\u0576\u0584 \u057e\u0565\u0580\u0561\u056f\u0561\u0576\u0563\u0576\u0574\u0561\u0576 \u0570\u0572\u0578\u0582\u0574\u0568",
      sendLink: "\u0548\u0582\u0572\u0561\u0580\u056f\u0565\u056c \u0570\u0572\u0578\u0582\u0574\u0568",
      sending: "\u0548\u0582\u0572\u0561\u0580\u056f\u057e\u0578\u0582\u0574 \u0567...",
      checkEmail: "\u054d\u057f\u0578\u0582\u0563\u0565\u0584 \u0571\u0565\u0580 \u0583\u0578\u057d\u057f\u0568",
      emailSent: "\u054e\u0565\u0580\u0561\u056f\u0561\u0576\u0563\u0576\u0574\u0561\u0576 \u0570\u0572\u0578\u0582\u0574\u0576 \u0578\u0582\u0572\u0561\u0580\u056f\u057e\u0565\u056c \u0567",
      checkSpam: "\u0549\u0565\u0584 \u057d\u057f\u0561\u0581\u0565\u055e\u056c \u0576\u0561\u0574\u0561\u056f\u0568. \u054d\u057f\u0578\u0582\u0563\u0565\u0584 \u057d\u057a\u0561\u0574\u056b \u0569\u0572\u0569\u0561\u057a\u0561\u0576\u0561\u056f\u0568",
      tryAgain: "\u0553\u0578\u0580\u0571\u0565\u056c \u0561\u0575\u056c email-\u0578\u057e",
      backToLogin: "\u054e\u0565\u0580\u0561\u0564\u0561\u057c\u0576\u0561\u056c \u0574\u0578\u0582\u057f\u0584\u056b \u0567\u057b",
    },
    resetPassword: {
      title: "\u0546\u0578\u0580 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c",
      cardTitle: "\u054d\u057f\u0565\u0572\u056e\u0565\u0584 \u0576\u0578\u0580 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c",
      cardDescription: "\u0544\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 \u0571\u0565\u0580 \u0576\u0578\u0580 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568 \u057d\u057f\u0578\u0580\u0587",
      newPassword: "\u0546\u0578\u0580 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c",
      confirmPassword: "\u0540\u0561\u057d\u057f\u0561\u057f\u0565\u0584 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568",
      updatePassword: "\u0539\u0561\u0580\u0574\u0561\u0581\u0576\u0565\u056c \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568",
      updating: "\u0539\u0561\u0580\u0574\u0561\u0581\u0576\u0578\u0582\u0574 \u0567...",
      success: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568 \u0569\u0561\u0580\u0574\u0561\u0581\u057e\u0565\u056c \u0567",
      successMessage: "\u0541\u0565\u0580 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568 \u0570\u0561\u057b\u0578\u0572\u0578\u0582\u0569\u0575\u0561\u0574\u0562 \u0569\u0561\u0580\u0574\u0561\u0581\u057e\u0565\u056c \u0567",
      continueToLogin: "\u0547\u0561\u0580\u0578\u0582\u0576\u0561\u056f\u0565\u056c \u0574\u0578\u0582\u057f\u0584",
    },
    signUp: {
      createAccount: "\u054d\u057f\u0565\u0572\u056e\u0565\u056c \u0570\u0561\u0577\u056b\u057e",
      signUpTitle: "\u0533\u0580\u0561\u0576\u0581\u0578\u0582\u0574",
      signUpDescription: "\u054d\u057f\u0565\u0572\u056e\u0565\u0584 \u0576\u0578\u0580 \u0570\u0561\u0577\u056b\u057e \u057d\u056f\u057d\u0565\u056c\u0578\u0582 \u0570\u0561\u0574\u0561\u0580",
      fullName: "\u0531\u0574\u0562\u0578\u0572\u057b\u0561\u056f\u0561\u0576 \u0561\u0576\u0578\u0582\u0576",
      email: "Email",
      password: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c",
      confirmPassword: "\u0540\u0561\u057d\u057f\u0561\u057f\u0565\u056c \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568",
      createAccountButton: "\u054d\u057f\u0565\u0572\u056e\u0565\u056c \u0570\u0561\u0577\u056b\u057e",
      creatingAccount: "\u0540\u0561\u0577\u056b\u057e\u0568 \u057d\u057f\u0565\u0572\u056e\u057e\u0578\u0582\u0574 \u0567...",
      alreadyHaveAccount: "\u0531\u0580\u0564\u0565\u0576 \u0578\u0582\u0576\u0565\u055e\u0584 \u0570\u0561\u0577\u056b\u057e",
      signIn: "\u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u056c",
      backToHome: "\u054e\u0565\u0580\u0561\u0564\u0561\u057c\u0576\u0561\u056c \u0563\u056c\u056d\u0561\u057e\u0578\u0580 \u0567\u057b",
      passwordsDontMatch: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0565\u0580\u0568 \u0579\u0565\u0576 \u0570\u0561\u0574\u0561\u057a\u0561\u057f\u0561\u057d\u056d\u0561\u0576\u0578\u0582\u0574",
      passwordTooShort: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568 \u057a\u0565\u057f\u0584 \u0567 \u056c\u056b\u0576\u056b \u0561\u057c\u0576\u057e\u0561\u0566\u0576 6 \u0576\u056b\u0577",
      invalidEmailFormat: "\u053d\u0576\u0564\u0580\u0578\u0582\u0574 \u0565\u0576\u0584 \u0574\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u056c \u057e\u0561\u057e\u0565\u0580 email \u0570\u0561\u057d\u0581\u0565",
      emailAlreadyInUse: "\u0531\u0575\u057d email-\u0568 \u0561\u0580\u0564\u0565\u0576 \u0563\u0580\u0561\u0576\u0581\u057e\u0561\u056e \u0567. \u053d\u0576\u0564\u0580\u0578\u0582\u0574 \u0565\u0576\u0584 \u0574\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u056c",
      emailServiceError: "\u0549\u0570\u0561\u057b\u0578\u0572\u057e\u0565\u0581 \u057d\u057f\u0578\u0582\u0563\u0565\u056c email-\u0568. \u0553\u0578\u0580\u0571\u0565\u0584 \u056f\u0580\u056f\u056b\u0576 \u056f\u0561\u0574 \u056f\u0561\u057a\u057e\u0565\u0584 \u0561\u057b\u0561\u056f\u0581\u0578\u0582\u0569\u0575\u0561\u0576 \u0570\u0565\u057f",
    },
    future: {
      horizon: "Հորիզոն",
      title: "Սա միայն սկիզբն է",
      subtitle: "Սիմուլյացիաներ. Բազմաագենտ համագործակցություն. Կանխատեսող կատարում. Նաիրին զարգանում է յուրաքանչյուր փոխազդեցության հետ, շարունակաբար ընդլայնելով այն, ինչ հնարավոր է միտքի և իրականության միջև.",
      quote: "Սա ծառայություն չէ. Սա նոր եղանակ է փոխազդելու իրականության հետ.",
      beginJourney: "Սկսեք ձեր ճանապարհորդությունը",
      joinWaitlist: "Միանալ սպասման ցուցակին",
    },
    feedback: {
      helpful: "Օգտակար",
      notHelpful: "Ոչ օգտակար",
      reportIssue: "Հայտնել խնդիր",
      thankYou: "Շնորհակալություն ձեր կարծիքի համար",
      errorOccurred: "Սխալ է տեղի ունեցել",
      tryAgain: "Կրկին փորձեք",
      somethingWentWrong: "Ինչ-որ բան սխալ է տեղի ունեցել",
      errorDescription: "Սպասված սխալ է տեղի ունեցել: Կարող եք փորձել կրկին կամ վերադառնալ գլխավոր:",
    },
    dashboard: {
      welcome: "Բարի վերադարձ",
      welcomeDescription: "Այստեղ է ինչ է պատահում ձեր AI ագենտների հետ այսօր:",
      tokensBalance: "Տոկենների մնացորդ",
      activeAgents: "Ակտիվ ագենտներ",
      conversations: "Զրույցներ",
      usageTime: "Օգտագործման ժամանակ",
      today: "այսօր",
      thisWeek: "Այս շաբաթ",
      thisMonth: "Այս ամիս",
      free: "անվճար",
      quickActions: "Արագ գործողություններ",
      quickActionsDesc: "Սկսեք աշխատել ձեր AI ագենտների հետ",
      startNewConversation: "Սկսել նոր զրույց",
      browseMarketplace: "Դիտել շուկայ",
      upgradePlan: "Բարելավել փակետը",
      recentConversations: "Վերջին զրույցներ",
      recentConversationsDesc: "Ձեր վերջին AI փոխազդեցությունները",
      yourAgents: "Ձեր ագենտները",
      yourAgentsDesc: "AI ագենտներ հասանելի ձեզ համար",
      viewAll: "Տեսնել բոլորը",
      newConversation: "Նոր զրույց",
      searchPlaceholder: "Փնտրել ագենտներ, զրույցներ, ստեղծագործություններ...",
      plan: "Փակետ",
      workspace: "Աշխատատեղի",
      builder: "Կառուցող",
      activity: "Գործունեություն",
      executionTraces: "Կատարման հետքեր",
      notifications: "Առաջարկություններ",
      creditsRewards: "Կրեդիտներ և փարգևատրումներ",
    },
  },
}

export function getTranslation(locale: Locale): TranslationStrings {
  return translations[locale] || translations.en
}
