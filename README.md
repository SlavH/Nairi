# Nairi Factory — AI Dev Team in a Box

> **AMD Developer Hackathon** — Track 1: AI Agents & Agentic Workflows

**Describe a web app. Three AI agents collaborate to build it — with live preview, code review, and one-click deploy.**

[![Demo](https://img.shields.io/badge/Demo-Live-purple)](https://nairi-seven.vercel.app/factory)
[![AMD GPU](https://img.shields.io/badge/GPU-AMD%20MI300X-red)](https://www.amd.com/en/developer)
[![ROCm](https://img.shields.io/badge/Framework-ROCm%206.2-blue)](https://rocm.docs.amd.com)
[![Qwen](https://img.shields.io/badge/Model-Qwen--2.5--72B-green)](https://huggingface.co/Qwen)

---

## What is Nairi Factory?

Nairi Factory is an **agentic AI system** where three specialized agents collaborate to build web applications from a single natural-language prompt:

| Agent | Role | Model |
|-------|------|-------|
| **🏗️ Architect** | Plans architecture, tech decisions, file structure | Qwen-2.5-72B |
| **👨‍💻 Developer** | Writes production-ready React + Tailwind code | Qwen-2.5-Coder-32B |
| **🔍 Reviewer** | Reviews code quality, finds bugs, ensures polish | Qwen-2.5-72B |

Unlike single-pass code generators, our agents **iterate**: the Reviewer finds issues, sends them back, and the Developer fixes them. The entire system runs on **AMD MI300X GPUs** via **ROCm** and **vLLM**.

## Quick Demo

1. Go to `/factory`
2. Type: *"Build a landing page for an AI fitness coaching app"*
3. Watch three agents plan, code, and review in real-time
4. See the live preview update as code is generated
5. Download or copy the production-ready code

**In 90 seconds, you get what would take a human developer 3 hours.**

---

## Tech Stack

### Frontend
- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS** + Shadcn/ui + Framer Motion
- **Sandpack** for live code preview

### AI / Agentic System
- **3-Agent Orchestration** — Planner → Builder → Critic loop
- **Qwen-2.5 models** via OpenAI-compatible API
- **Streaming responses** for real-time agent visualization

### Infrastructure
- **AMD Instinct MI300X** GPU (AMD Developer Cloud)
- **ROCm 6.2** + **vLLM** for serving
- **Supabase** for auth + database
- **Cloudflared** for secure tunneling

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/SlavH/Nairi.git
cd Nairi
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

**Minimum for Factory demo:**

```env
# AI Backend (any OpenAI-compatible endpoint)
BITNET_BASE_URL=https://your-endpoint/v1

# Auth (dev mode — bypasses login)
BYPASS_AUTH=true

# Supabase (optional for full features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### 3. Run

```bash
npm run dev
```

Open **http://localhost:3000/factory**

---

## AMD GPU Setup

See [docs/AMD_GPU_INTEGRATION.md](docs/AMD_GPU_INTEGRATION.md) for full instructions on deploying Qwen models on AMD MI300X via ROCm and vLLM.

**Quick start:**
1. Launch MI300X instance on AMD Developer Cloud
2. Install ROCm + vLLM
3. Serve Qwen-2.5-72B: `python -m vllm.entrypoints.openai.api_server --model Qwen/Qwen2.5-72B-Instruct`
4. Tunnel with cloudflared: `cloudflared tunnel --url http://localhost:8000`
5. Set `BITNET_BASE_URL` to the tunnel URL

---

## Architecture

```
User Prompt
    │
    ▼
┌─────────────────┐
│   Architect     │  Plans: sections, components, colors, tasks
│  (Qwen-72B)     │
└────────┬────────┘
         │  Plan (JSON)
         ▼
┌─────────────────┐
│   Developer     │  Generates: React + Tailwind code
│  (Qwen-Coder)   │
└────────┬────────┘
         │  Code files
         ▼
┌─────────────────┐
│   Reviewer      │  Checks: quality, bugs, accessibility
│  (Qwen-72B)     │
└────────┬────────┘
         │  Approve or fix
    ┌────┴─────┐
    │          │
  APPROVE   NEEDS FIX → Developer iterates
```

---

## Agent Prompts

### Architect (Planner)
```
You are a senior software architect. Analyze the user's web app request
and create a detailed build plan: sections, components, color scheme,
tech decisions, and ordered tasks.
```

### Developer (Builder)
```
You are an expert React developer. Generate production-quality single-page
React apps with Tailwind CSS, real content, animations, and responsive design.
```

### Reviewer (Critic)
```
You are a senior code reviewer. Check for syntax errors, missing imports,
responsive design, accessibility, and polish. Approve or list specific fixes.
```

---

## Project Structure

```
app/
├── factory/                    # Factory page (hackathon feature)
│   └── page.tsx
├── api/factory/generate/       # Agent orchestration API
│   └── route.ts
├── builder/                    # AI website builder (existing)
├── chat/                       # AI chat (existing)
└── ...
lib/
├── agents/                     # Agent system (new)
│   └── types.ts
├── ai/                         # AI generation
└── builder-v2/                 # Builder engine (existing)
docs/
├── AMD_GPU_INTEGRATION.md      # AMD setup guide (new)
└── ...
```

---

## Demo Prompts

Try these in the Factory:

1. **SaaS Landing Page** — *"Build a landing page for an AI-powered fitness coaching app called FitMind. Dark theme with purple accents, hero section, features grid, pricing cards, testimonials."*

2. **Dashboard** — *"Create a SaaS dashboard for a project management tool with sidebar navigation, charts, task list, and team members panel. Light theme with blue accents."*

3. **Portfolio** — *"Build a portfolio website for a photographer with a full-screen hero gallery, about section, portfolio grid, and contact form. Minimal black and white design."*

---

## Why AMD?

- **192 GB HBM3 memory** — runs 70B+ models without quantization
- **5.3 TB/s memory bandwidth** — fast inference for large models
- **ROCm open ecosystem** — no vendor lock-in, PyTorch native
- **Cost-effective** — better price/performance than equivalent NVIDIA GPUs

---

## Beyond Factory

Nairi Factory is built on the **Nairi platform** — a full-stack AI assistant with:
- Multi-provider AI chat (`/chat`)
- AI website builder (`/builder`)
- Agent marketplace (`/marketplace`)
- Presentation generator (`/presentations`)
- Learning platform (`/learn`)
- Knowledge graph (`/knowledge`)

Factory represents our evolution from **single AI assistant** to **collaborative AI teams**.

---

## Hackathon Submission

- **Track:** AI Agents & Agentic Workflows
- **Tech:** AMD Developer Cloud, ROCm, vLLM, Qwen-2.5
- **Demo:** http://localhost:3000/factory
- **Code:** Open source (MIT)

---

## License

MIT
