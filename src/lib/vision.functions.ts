import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  imageBase64: z.string().min(50), // data URL or raw base64
  hint: z.string().optional(),
});

export type FoodAnalysis = {
  name: string;
  portion_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
};

const PROMPT = `You are a nutrition expert. Analyze the food in the image and estimate:
- dish name (short)
- portion weight in grams
- calories (kcal)
- protein (g)
- carbs (g)
- fat (g)
- confidence 0-1

Reply ONLY as strict JSON, no markdown, no code fences. Shape:
{"name":"","portion_g":0,"kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"confidence":0}`;

function extractJson(text: string): FoodAnalysis | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return {
      name: String(parsed.name ?? "Unknown dish"),
      portion_g: Math.max(0, Number(parsed.portion_g) || 0),
      kcal: Math.max(0, Number(parsed.kcal) || 0),
      protein_g: Math.max(0, Number(parsed.protein_g) || 0),
      carbs_g: Math.max(0, Number(parsed.carbs_g) || 0),
      fat_g: Math.max(0, Number(parsed.fat_g) || 0),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    };
  } catch {
    return null;
  }
}

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .validator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const imageUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:image/jpeg;base64,${data.imageBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT + (data.hint ? `\n\nUser hint: ${data.hint}` : "") },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Vision API failed: ${res.status} ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(typeof text === "string" ? text : JSON.stringify(text));
    if (!parsed) throw new Error("Could not parse nutrition data from response.");
    return parsed;
  });
