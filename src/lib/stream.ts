import type { ChatMessage } from "@/stores/coach";
import { PERSONAS, type PersonaKey } from "@/lib/personas";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
export type ApiContent = string | Array<TextPart | ImagePart>;
export type ApiMessage = { role: "system" | "user" | "assistant"; content: ApiContent };

export type StreamOpts = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ApiMessage[];
  signal?: AbortSignal;
  onDelta: (text: string) => void;
};

export async function streamChat(opts: StreamOpts): Promise<void> {
  const url = opts.baseUrl.replace(/\/$/, "") + "/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content ?? "";
        if (delta) opts.onDelta(delta);
      } catch {
        /* ignore keepalives */
      }
    }
  }
}

export function toApiMessages(
  systemPrompt: string,
  contextJson: unknown,
  history: ChatMessage[],
  persona?: PersonaKey,
): ApiMessage[] {
  const personaPrompt = persona ? PERSONAS[persona].systemPrompt : "";
  return [
    {
      role: "system" as const,
      content: `${systemPrompt}\n\n${personaPrompt ? `PERSONA:\n${personaPrompt}\n\n` : ""}USER_CONTEXT:\n${JSON.stringify(contextJson, null, 2)}`,
    },
    ...history
      .filter((m) => m.role !== "system")
      .map((m): ApiMessage => {
        if (m.role === "user" && m.image) {
          return {
            role: "user",
            content: [
              { type: "text", text: m.content || "" },
              { type: "image_url", image_url: { url: m.image } },
            ],
          };
        }
        return { role: m.role as "user" | "assistant", content: m.content };
      }),
  ];
}
