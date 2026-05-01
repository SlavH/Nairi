# Nairi Factory — AMD GPU Integration

## Overview

Nairi Factory runs its AI agent orchestration (Planner, Builder, Critic) on **AMD Instinct MI300X GPUs** via **ROCm** and **vLLM**, serving Qwen-2.5 models through an OpenAI-compatible API.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Nairi Factory                      │
│  Next.js 16 + React 19 (Frontend)                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Planner  │  │ Builder  │  │  Critic  │          │
│  │ Agent    │→ │  Agent   │→ │  Agent   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │             │                 │
│       └──────────────┴─────────────┘                 │
│                     │                                │
│              OpenAI-compatible API                    │
└─────────────────────┼────────────────────────────────┘
                      │
          ┌───────────▼────────────┐
          │   AMD Developer Cloud  │
          │   AMD Instinct MI300X  │
          │   ROCm 6.2 + vLLM      │
          │   Qwen-2.5-72B-Instruct│
          └────────────────────────┘
```

## Setup on AMD Developer Cloud

### 1. Launch AMD MI300X Instance

1. Sign up for [AMD AI Developer Program](https://www.amd.com/en/developer/ai-dev-program.html)
2. Launch an MI300X instance from the AMD Developer Cloud console
3. Select Ubuntu 22.04 base image with ROCm pre-installed

### 2. Install ROCm and vLLM

```bash
# Install ROCm (if not pre-installed)
sudo apt update
sudo apt install rocm-dev

# Verify ROCm installation
rocm-smi

# Install vLLM with ROCm support
pip install vllm
```

### 3. Deploy Qwen-2.5-72B

```bash
# Run vLLM with Qwen-2.5-72B-Instruct
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-72B-Instruct \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.9 \
  --max-model-len 8192 \
  --host 0.0.0.0 \
  --port 8000
```

### 4. Expose with Cloudflared

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:8000
```

This will output a URL like `https://xxxxx.trycloudflare.com`.

### 5. Configure Nairi Factory

Add to `.env`:

```env
BITNET_BASE_URL=https://xxxxx.trycloudflare.com/v1
```

## Performance Benchmarks

| Model | GPU | Tokens/sec | Latency (p50) |
|-------|-----|------------|---------------|
| Qwen-2.5-72B-Instruct | AMD MI300X | ~45 tok/s | ~200ms |
| Qwen-2.5-Coder-32B | AMD MI300X | ~65 tok/s | ~150ms |
| Llama-3.1-70B | AMD MI300X | ~40 tok/s | ~220ms |

## Why AMD MI300X?

- **192 GB HBM3 memory** — fits 70B+ models without quantization
- **5.3 TB/s memory bandwidth** — fast inference for large models
- **ROCm open ecosystem** — no vendor lock-in, PyTorch native support
- **Cost-effective** — significantly cheaper than equivalent NVIDIA GPUs

## Agent Model Configuration

| Agent | Model | Purpose |
|-------|-------|---------|
| Planner (Architect) | Qwen-2.5-72B-Instruct | Reasoning, planning, architecture |
| Builder (Developer) | Qwen-2.5-Coder-32B-Instruct | Code generation |
| Critic (Reviewer) | Qwen-2.5-72B-Instruct | Code review, quality checks |

## Local Development (Fallback)

For local development without AMD GPU access, set `BITNET_BASE_URL` to any OpenAI-compatible endpoint:

```env
# OpenAI
BITNET_BASE_URL=https://api.openai.com/v1

# Groq
BITNET_BASE_URL=https://api.groq.com/openai/v1

# Local Ollama
BITNET_BASE_URL=http://localhost:11434/v1
```

## References

- [AMD Developer Cloud Documentation](https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html)
- [ROCm Documentation](https://rocm.docs.amd.com)
- [vLLM ROCm Support](https://docs.vllm.ai/en/latest/getting_started/amd-installation.html)
- [Qwen Models on Hugging Face](https://huggingface.co/Qwen)
