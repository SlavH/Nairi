# Nairi v34 - Missing Features & Incomplete Functionality

## Overview
This document identifies features that are advertised, partially implemented, or missing from the Nairi v34 platform.

**Remediation (Feb 2026)**: CRIT-001 (chat input), MAJ-001 (empty security boxes), MAJ-002 (Explore Marketplace), MAJ-003 (mobile), MIN-001 (quick actions), MIN-002 (Docs link) have been fixed. See [PROGRESS.md](../../PROGRESS.md) and plan remediation docs.

---

## 🔴 NON-FUNCTIONAL FEATURES (Remediated)

### 1. Chat Text Input
- **Status**: ✅ FIXED (CRIT-001)
- **Fix**: Input flow hardened in `components/chat/chat-interface.tsx`; E2E test added for type + send.

### 2. Explore Marketplace Button (Landing Page)
- **Status**: ✅ FIXED (MAJ-002)
- **Fix**: Direct Link to /marketplace in `components/marketplace-section.tsx`; E2E in `e2e/home.spec.ts`.

---

## 🟡 PARTIALLY IMPLEMENTED (Remediated)

### 1. Mobile Responsive Design
- **Status**: ✅ FIXED (MAJ-003)
- **Fix**: Collapsible sidebars; main/header use `pl-14` on small screens so content clears hamburger.

### 2. Landing Page Security Section
- **Status**: ✅ FIXED (MAJ-001)
- **Fix**: Optional chaining and fallback copy in `components/security-section.tsx` so content always renders.

---

## 🟠 UI-ONLY (Not Fully Tested)

### 1. Video Generation
- **Status**: UI Present, functionality not verified
- **Models Listed**: Veo 2, Runway Gen-3, Sora, Pika Labs
- **Needs**: Full generation flow testing

### 2. Canvas Editor
- **Status**: UI Present, drawing not tested
- **Needs**: Drawing and AI assistance testing

### 3. Voice Mode
- **Status**: UI Present, voice not tested
- **Needs**: Microphone and conversation testing

### 4. Code Agent (in Chat)
- **Status**: UI Present, coding not tested
- **Needs**: Code generation and editing testing

### 5. Workflows
- **Status**: UI Present, execution not tested
- **Needs**: Workflow creation and execution testing

---

## 🔵 ADVERTISED BUT NOT VERIFIED

### From Landing Page "Create Everything" Section:

| Feature | Status | Notes |
|---------|--------|-------|
| Any text format | ⚠️ Not Tested | Chat fixed; can be tested |
| Presentations | ✅ Working | Verified |
| Websites & Interfaces | ⚠️ Not Tested | Builder /builder-v2 exists |
| Visual concepts | ✅ Working | Image generation |
| Ideas & Strategies | ⚠️ Not Tested | Chat fixed; can be tested |
| Simulations | 🔜 "Soon" | Advertised as coming; /simulations page exists |

---

## 📋 FEATURES REQUIRING VALIDATION (Validated – Routes & UI)

Validation performed by codebase inspection (routes and sidebar links verified).

| # | Feature | Route(s) | Sidebar / Nav | Status |
|---|---------|----------|---------------|--------|
| 1 | Website Generation | /builder, /builder-v2 | Builder link → /builder-v2 | ✅ Route exists; UI loads |
| 2 | Multi-language Support | (i18n context) | Language selector in header | ✅ Present in code |
| 3 | API Access | /settings (API tab), /docs/api | Settings → API tab | ✅ Route exists |
| 4 | Billing/Payments | /dashboard/billing, /billing | Sidebar Billing | ✅ Route exists |
| 5 | Notifications | /dashboard/notifications, /notifications | Sidebar Notifications | ✅ Route exists |
| 6 | Activity Tracking | /dashboard/activity, /activity | Sidebar Activity | ✅ Route exists |
| 7 | Execution Traces | /dashboard/traces, /execution-traces | Sidebar Execution Traces | ✅ Route exists |
| 8 | Knowledge Graph | /knowledge | Sidebar Knowledge | ✅ Route exists |
| 9 | Nairi Learn | /learn, /learn/skill-tree, /learn/courses/[id] | Sidebar Learn | ✅ Route exists |
| 10 | Nairi Flow | /flow, /flow/create | Sidebar Flow | ✅ Route exists |

All 10 features have corresponding app routes and sidebar navigation; core behavior (e.g. API calls, payments) should be verified with manual or E2E tests as needed.

---

## 🎯 RECOMMENDATIONS

1. ~~**Priority 1**: Fix chat input~~ ✅ Done
2. ~~**Priority 2**: Complete landing page content~~ ✅ Done (MAJ-001)
3. ~~**Priority 3**: Implement mobile responsive design~~ ✅ Done (MAJ-003)
4. **Priority 4**: Full end-to-end testing of all generation features (Video, Canvas, Voice, Code Agent, Workflows)
5. **Priority 5**: Run E2E suite after `npx playwright install`; optional manual test of sidebar destinations
