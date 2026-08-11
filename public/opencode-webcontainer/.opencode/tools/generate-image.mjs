/**
 * Generate an image using Pollinations.ai
 * Verified: 2026-07-20 — gen.pollinations.ai
 */
export default {
  description: "Generate an image using Pollinations.ai",
  args: {
    prompt: { type: "string", description: "Text description of the image" },
    model: {
      type: "string",
      description:
        "Model: flux, zimage, gptimage, gpt-image-2, klein, nova-canvas",
    },
    width: {
      type: "number",
      description: "Width in pixels (default 1024)",
    },
    height: {
      type: "number",
      description: "Height in pixels (default 1024)",
    },
    seed: {
      type: "number",
      description: "Seed for reproducibility (default -1 = random)",
    },
  },
  execute: async ({
    prompt,
    model = "flux",
    width = 1024,
    height = 1024,
    seed = -1,
  }) => {
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&width=${width}&height=${height}&seed=${seed}`
    const res = await fetch(url)
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After")
      throw new Error(
        `Rate limited. Retry after ${retryAfter || "a few"} seconds.`
      )
    }
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const fs = require("fs")
    const filename = `/images/${Date.now()}-${model}.png`
    fs.writeFileSync(filename, buffer)
    return filename
  },
}
