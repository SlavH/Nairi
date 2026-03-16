# Nairi v34 Sitemap & Structure

**Remediation (Feb 2026)**: Critical/major/minor issues from nairi_v34_res plan have been addressed (CRIT-001, MAJ-001, MAJ-002, MAJ-003, MIN-001, MIN-002). Empty boxes in "Power with control" section resolved (MAJ-001).

## Main Navigation (Header - Public)
- How it works (anchor link to section)
- Capabilities (anchor link to section)
- Marketplace (anchor link to section)
- Security
- Builder
- Docs
- English (language selector)
- Sign In
- Get Started (/auth/sign-up)

## Landing Page Sections
- Hero section with "Start Creating" and "Watch Demo" buttons
- Nairi Interface demo preview
- "From thought to reality" - 4-step process
- "Create everything" - capability showcase
  - Any text format
  - Presentations
  - Websites & Interfaces
  - Visual concepts
  - Ideas & Strategies
  - Simulations (Soon badge)
  - And more...
- Marketplace ecosystem section
- Trending Creations showcase
- Fair access/credits system
- Power with control (security features) – remediated (MAJ-001)
- "This is only the beginning" section
- Footer with links

## Footer Links
- Product: How it works, Capabilities, Marketplace, Pricing
- Company: About, Blog, Careers, Contact, Help Center, Documentation
- Legal: Privacy, Terms, Cookie Policy, Security
- Social: X (Twitter), GitHub, LinkedIn

## Dashboard Sidebar Navigation (Authenticated)
- Dashboard (/dashboard)
- AI Chat (/chat)
- Presentations (/presentations)
- Workspace (/workspace)
- Builder (/builder)
- Nairi Learn
- Nairi Flow
- Knowledge Graph
- Marketplace (/marketplace)
- Activity
- Execution Traces
- Notifications
- Credits & Rewards (/dashboard/credits)
- Earn Credits
- Billing (/dashboard/billing)
- Settings (/settings)
- User Profile
- Sign Out

## Routes Identified
- / (home)
- /auth/sign-up
- /auth/sign-in
- /marketplace
- /marketplace/{agent-id}
- /dashboard
- /dashboard/credits
- /dashboard/billing
- /chat
- /chat/{conversation-id}
- /presentations
- /workspace
- /builder
- /settings
- /pricing
- /about
- /blog
- /careers
- /contact
- /help-center
- /documentation
- /privacy
- /terms
- /cookie-policy

## UI Components Identified

### Global
- Navigation bar (public/authenticated)
- Language selector dropdown
- Global search bar
- Notification bell
- Plan indicator badge
- User avatar/profile
- Sidebar navigation

### Landing Page
- CTA buttons (Start Creating, Watch Demo, Get Started)
- Demo interface preview
- Feature cards
- Marketplace cards with pricing
- Credits display widget
- Security feature tabs

### Dashboard
- Stats cards (Tokens, Active Agents, Conversations, Creations)
- Quick Actions buttons
- Recent Conversations list
- Your Agents cards

### Marketplace
- Search input
- Category filter dropdown
- Sort dropdown
- Featured Agents cards
- All Agents grid
- Get/Use Agent buttons
- Price badges

### Chat
- New Chat button
- Conversations list
- Free Agents list
- Tab bar (Image, Video, Canvas, Artifacts, Voice, Code, Workflows)
- Quick action pills (All, Write, Learn, Create, Analyze)
- Action cards grid
- Message input field
- Execution mode indicator
- Attachment/voice buttons

### Credits & Rewards
- Credits balance display
- Progress bar
- Reset timer
- Streak counter
- Earn credits cards with Claim buttons
- Referral code display
- Invite stats

## Architectural Notes
- Next.js application (/_next/ assets)
- Client-side routing
- Authentication state persisted
- Real-time updates (conversations)
- Token/credits system
- Agent marketplace model
