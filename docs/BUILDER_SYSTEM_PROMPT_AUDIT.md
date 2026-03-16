# Builder System Prompt Audit (Phase 1)

Reference for the builder system prompt improvement plan. Source: `V0_SYSTEM_PROMPT` in `app/api/builder/generate/route.ts` (lines 833–1288).

## Section list (purpose and approximate range)

| Section | Purpose | Lines (approx) |
|---------|---------|----------------|
| Opening (Role/Goal/Constraints) | Identity, output shape, hard constraints | 833–839 |
| INTERPRETING REQUESTS | v0-style: product surface, context, constraints | 841–849 |
| BOLT-STYLE RULES | Beautiful not cookie-cutter; complete response | 851–855 |
| OUTPUT FORMAT (CRITICAL) | JSON only, plan/files/message, no document tags | 857–865 |
| MIND-BLOWN DESIGN | Images, animations, wow moment, polish on every site | 867–876 |
| YOUR MISSION | Fascinating, memorable, creative risk, production-ready | 878–884 |
| ALL WEBSITE TYPES | Bullet list of types (e-commerce, dashboard, …) | 886–902 |
| MULTI-PAGE SITES | Option A (hash routing), Option B (single file) | 904–916 |
| CRITICAL REQUIREMENTS | 7 numbered rules (imports, complete, semantic, etc.) | 918–926 |
| FORBIDDEN SINGLE-DIV | No single div; nav/main/section required | 928–933 |
| FASCINATING DESIGN (MANDATORY) | Aesthetic, typography, color, layout, wow | 935–940 |
| IMAGES (REQUIRED) | Unsplash/Picsum, hero + sections, alt/rounded/hover | 942–946 |
| ANIMATIONS (REQUIRED) | Hero, scroll, hover, micro, background | 948–981 |
| MODERN DESIGN PATTERNS | Glassmorphism, neumorphism, gradient, bento, 3D, glow | 983–1010 |
| COLOR PALETTES | Dark/light mode Tailwind examples | 1012–1025 |
| TYPOGRAPHY EXCELLENCE | Headlines, subheadlines, body, weights | 1027–1033 |
| SPACING & LAYOUT | Whitespace, container, card padding, gap | 1035–1040 |
| COMPONENT PATTERNS: HeroSection | Long TSX example | 1042–1069 |
| COMPONENT PATTERNS: FeatureCard | Long TSX example | 1071–1088 |
| MULTI-PAGE ROUTING | State-based routing; long TSX (nav, HomePage/AboutPage as div) | 1090–1160 |
| RULES | 11 numbered rules (React, Tailwind, Lucide, etc.) | 1162–1164 |
| ELITE ASSISTANT BEHAVIOR | Complete code, Tailwind pref, reasoning, tone | 1166–1173 |
| VEEERY FASCINATING DESIGN | Typography, color, motion, copy, backgrounds (repeat) | 1175–1183 |
| TASK DISCIPLINE | Use context, v0 structure, avoid over-engineering | 1185–1192 |
| REQUIRED KEYFRAME ANIMATIONS | Long CSS-in-JS block (fadeInUp, float, blob, …) | 1194–1227 |
| OUTPUT FOR /app/page.tsx | No html/head/body; single default export | 1229–1236 |
| RESPONSE FORMAT | JSON shape again | 1238–1253 |
| QUALITY CHECKLIST | 14 checklist items | 1255–1271 |
| VIRAL CHECKLIST | 5 items for viral landings | 1273–1278 |
| RESPONSE SCHEMA | plan/files/message only; no markdown | 1280–1287 |

## Duplicate concepts

- **Output = JSON only / no markdown**: Opening CONSTRAINTS, OUTPUT FORMAT (CRITICAL), OUTPUT FOR /app/page.tsx, RESPONSE FORMAT, RESPONSE SCHEMA.
- **No &lt;html&gt;/&lt;head&gt;/&lt;body&gt;/RootLayout/metadata**: CONSTRAINTS, OUTPUT FORMAT **CRITICAL** bullet, OUTPUT FOR /app/page.tsx, RULES #7.
- **Fascinating / mind-blown / design quality**: MIND-BLOWN DESIGN, YOUR MISSION, FASCINATING DESIGN (MANDATORY), VEEERY FASCINATING DESIGN, QUALITY CHECKLIST “Wow factor” / “Overall.”
- **Images required**: MIND-BLOWN #1, IMAGES (REQUIRED ON EVERY SITE), QUALITY CHECKLIST “Images.”
- **Animations / motion**: MIND-BLOWN #2–3, ANIMATIONS (REQUIRED), QUALITY CHECKLIST “Animations” / “Motion.”
- **Real copy / no Lorem ipsum**: CONSTRAINTS #5, MIND-BLOWN #4, CRITICAL REQUIREMENTS #4, VEEERY FASCINATING “Copy”, QUALITY CHECKLIST “Content”, VIRAL CHECKLIST.
- **Semantic structure (nav, main, section)**: FORBIDDEN SINGLE-DIV, CRITICAL REQUIREMENTS #6, QUALITY CHECKLIST “Layout”, RULES.
- **plan/files/message schema**: OUTPUT FORMAT, RESPONSE FORMAT, RESPONSE SCHEMA.

## Contradictions

- **Multi-page routing**: MULTI-PAGE SITES describes **hash-based routing** (#/about, window.location.hash, useEffect hashchange). MULTI-PAGE ROUTING section says “USE STATE-BASED ROUTING - Do NOT use window.location” and shows useState + setCurrentPage. So: hash routing vs state-based are both present; state-based example contradicts MULTI-PAGE Option A.
- **Page components in state-based example**: `function HomePage() { return <div>...</div>; }` (and AboutPage, etc.) show page content as a single `<div>`, which contradicts FORBIDDEN SINGLE-DIV and “use &lt;main&gt; and &lt;section&gt;.”

## Notes for later phases

- Tier 1 (critical) should be: output format + schema, forbidden (document tags + single-div), imports, single default export. Put once at top and once as short reminder at end.
- Single “design quality” block should merge MIND-BLOWN, YOUR MISSION, FASCINATING, VEEERY FASCINATING.
- Website-type list should be removed from prompt; layout from design-intelligence (injected as DESIGN GUIDANCE).
- Multi-page: standardize on hash-based routing for multi-file; state-based only when all pages in one file. Fix code example so page components use &lt;main&gt; + &lt;section&gt;, not &lt;div&gt;.
- Long HeroSection/FeatureCard TSX and long keyframes block should be shortened to pattern descriptions + minimal examples.
