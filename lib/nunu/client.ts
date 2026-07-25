import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

// Server-only — never import this from a "use client" file. The key comes
// from ANTHROPIC_API_KEY and is never bundled into client JS.
export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
