const fs = require('fs');
const path = require('path');

const chatRoutePath = path.join(__dirname, 'app/api/chat/route.ts');
let content = fs.readFileSync(chatRoutePath, 'utf8');

// 1. Add useOpenCodeBackend function after useOllamaBackend
const ollamaFnEnd = 'function useOllamaBackend(): boolean {\n  return isOllamaConfigured() && !process.env.NAIRI_AI_BASE_URL?.trim()\n}';
const opencodeFn = '\n/** Use OpenCode API when OPENCODE_API_URL is set */\nfunction useOpenCodeBackend(): boolean {\n  return !!process.env.OPENCODE_API_URL?.trim()\n}\n';

if (!content.includes('useOpenCodeBackend')) {
  content = content.replace(ollamaFnEnd, ollamaFnEnd + opencodeFn);
}

// 2. Add opencode backend check before Nairi Router section
const nairiRouterSection = '// Nairi Router or Nairi AI/Colab streaming (streamWithFallback uses Router when NAIRI_ROUTER_BASE_URL is set)';
const opencodeSection = `    // OpenCode backend (opencode API): use when OPENCODE_API_URL is set\n    if (useOpenCodeBackend()) {\n      try {\n        const opencodeRes = await fetch(\`\${process.env.OPENCODE_API_URL}/session\`, {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ title: \`nairi-chat-\${userId || "anon"}\` }),\n          signal: AbortSignal.timeout(60000),\n        })\n        if (!opencodeRes.ok) {\n          const errText = await opencodeRes.text()\n          console.error('[chat] OpenCode session creation failed:', errText)\n          return new Response(JSON.stringify({ error: "OpenCode backend error", details: errText }), {\n            status: 502,\n            headers: { "Content-Type": "application/json" },\n          })\n        }\n        const sessData = await opencodeRes.json()\n        const sessionId = sessData.id\n\n        const lastUserMsg = modelMessages.filter(m => m.role === "user").pop()\n        const userText = lastUserMsg?.content || userContent\n\n        const msgRes = await fetch(\`\${process.env.OPENCODE_API_URL}/session/\${sessionId}/message\`, {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ parts: [{ type: "text", text: userText }] }),\n          signal: AbortSignal.timeout(60000),\n        })\n\n        if (!msgRes.ok) {\n          const errText = await msgRes.text()\n          console.error('[chat] OpenCode message failed:', errText)\n          return new Response(JSON.stringify({ error: "OpenCode message failed", details: errText }), {\n            status: 502,\n            headers: { "Content-Type": "application/json" },\n          })\n        }\n\n        const msgData = await msgRes.json()\n        const textPart = (msgData.parts || []).find((p) => p.type === "text")\n        const replyText = textPart?.text || JSON.stringify(msgData)\n\n        if (userId && conversationId) {\n          const supabaseForSave = await createClient()\n          await supabaseForSave.from("messages").insert({\n            conversation_id: conversationId,\n            user_id: userId,\n            role: "assistant",\n            content: replyText,\n          })\n        }\n\n        const stream = createUIMessageStream({\n          execute: ({ writer }) => {\n            const id = \`opencode-\${Date.now()}\`\n            writer.write({ type: "text-start", id })\n            writer.write({ type: "text-delta", id, delta: replyText })\n            writer.write({ type: "text-end", id })\n          },\n        })\n        const response = createUIMessageStreamResponse({ stream })\n        const wrappedBody = wrapStreamWithQualityGates(response.body, "chat")\n        return new Response(wrappedBody ?? undefined, {\n          status: response.status,\n          headers: response.headers,\n        })\n      } catch (err) {\n        console.error('[chat] OpenCode backend error:', err)\n        // Fall through to other backends\n      }\n    }\n\n    `;

if (!content.includes('useOpenCodeBackend()')) {
  content = content.replace(nairiRouterSection, opencodeSection + nairiRouterSection);
}

fs.writeFileSync(chatRoutePath, content);
console.log('Added OpenCode backend to chat route');
