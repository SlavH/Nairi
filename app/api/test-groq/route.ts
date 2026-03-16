// Test endpoint for Colab AI (GET /api/test-groq)
import { generateWithFallback } from "@/lib/ai/groq-direct"

export async function GET() {
  try {
    if (!process.env.BITNET_BASE_URL?.trim()) {
      return Response.json({ error: "Set BITNET_BASE_URL in .env to your Colab tunnel URL" }, { status: 500 })
    }

    const { text, model } = await generateWithFallback({
      system: "You are a helpful assistant.",
      prompt: "Say 'Hello, Nairi test successful!' and nothing else.",
      temperature: 0.7,
      maxOutputTokens: 50,
      fast: true,
    })

    return Response.json({
      success: true,
      message: text,
      model,
      provider: "colab",
    })
  } catch (error) {
    console.error("Test error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
