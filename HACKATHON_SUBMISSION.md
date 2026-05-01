# Nairi Factory — Hackathon Submission

## One-Sentence Pitch
Nairi Factory turns your app idea into production-ready code using a team of three AI agents — architect, developer, and reviewer — all running on AMD GPUs.

## 30-Second Pitch
Today, building a web app still requires a team of developers. We changed that.

Nairi Factory is an agentic AI system where three specialized agents — an architect that plans, a developer that codes, and a reviewer that quality-checks — collaborate to build complete web applications from a single prompt.

Unlike code generators that produce one-pass output, our agents iterate: the reviewer finds bugs, sends them back, and the developer fixes them. The entire system runs on AMD MI300X GPUs using ROCm and Qwen models.

In 90 seconds, you get what would take a human developer 3 hours. This isn't a chatbot. It's a dev team.

## Key Message
**Stop building AI chatbots. Start building AI teams.**

---

## Demo Script (2 minutes)

### 0:00 — Opening
> "Today I'll show you Nairi Factory — an AI dev team that builds web apps from a single prompt. Three agents collaborate: an architect plans, a developer codes, and a reviewer quality-checks. All running on AMD GPUs."

### 0:15 — Navigate to /factory
> "Here's the Factory interface. On the left, you'll see our three agents. On the right, the live preview and code panel."

### 0:25 — Enter Demo Prompt
Type: *"Build a landing page for an AI-powered fitness coaching app called FitMind. Dark theme with purple accents, hero section, features grid, pricing cards, testimonials."*

### 0:35 — Hit Send
> "Watch what happens next."

### 0:40 — Phase 1: Architect Plans (visible in agent feed)
- Architect lights up purple
- Shows thought bubbles: "Analyzing requirements...", "Creating architecture plan..."
- Plan appears: 6 tasks, 5 components, dark theme with purple accents

### 1:00 — Phase 2: Developer Codes
- Developer lights up blue
- Shows: "Writing page.tsx...", "Implementing hero section..."
- Files appear in code panel
- Live preview updates with generated code

### 1:25 — Phase 3: Reviewer Checks
- Reviewer lights up green
- Shows: "Reviewing code quality...", "Checking responsiveness..."
- Displays verdict: approve or fix notes

### 1:40 — Final Result
> "And here's the result — a complete, polished landing page with hero, features, pricing, and testimonials. Dark theme, purple accents, animations, responsive design. All generated in under 2 minutes by three collaborating AI agents on AMD hardware."

### 1:50 — Close
> "This is Nairi Factory. Stop building chatbots. Start building AI teams. Thank you."

---

## Submission Details

### Track
**Track 1: AI Agents & Agentic Workflows**

### Technology
- **AMD Developer Cloud** — MI300X GPU instances
- **ROCm 6.2** — GPU computing platform
- **vLLM** — High-throughput LLM serving
- **Qwen-2.5-72B-Instruct** — Primary model (planner + critic)
- **Qwen-2.5-Coder-32B** — Code generation model
- **Next.js 16 + React 19** — Frontend
- **Supabase** — Auth + database

### What Makes This Different
1. **Multi-agent coordination** — not a single AI, but 3 specialized agents working together
2. **Visible reasoning** — you see what each agent thinks, not just the output
3. **Iterative improvement** — critic finds bugs, developer fixes them
4. **AMD-native** — built for and tested on AMD MI300X with ROCm
5. **Live preview** — code updates in real-time as agents generate it

### Links
- **GitHub:** https://github.com/SlavH/Nairi
- **Live Demo:** /factory
- **AMD Integration:** docs/AMD_GPU_INTEGRATION.md
- **Hugging Face Space:** (deploy after submission)

---

## Build-in-Public Checklist

- [ ] Post 1: "Building an AI dev team on AMD GPUs — architect, developer, reviewer agents collaborating to build web apps" (tag @lablabai + @AIatAMD)
- [ ] Post 2: "Our 3-agent system running on AMD MI300X with ROCm + vLLM — Qwen-72B handling planning and code review" (tag @lablabai + @AIatAMD)
- [ ] Technical walkthrough: README.md + docs/AMD_GPU_INTEGRATION.md
- [ ] Open-source: MIT license on GitHub
