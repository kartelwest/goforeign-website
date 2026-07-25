import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "./client";

const ShiftSchema = z.object({
  date: z.string().describe("YYYY-MM-DD"),
  start_time: z.string().describe("24-hour HH:MM"),
  end_time: z.string().describe("24-hour HH:MM"),
  label: z.string().describe("e.g. 'Work shift', 'Closing shift'"),
});

const ScheduleExtractionSchema = z.object({
  shifts: z.array(ShiftSchema),
  confidence: z.number().describe("0 to 1, overall confidence in the extraction"),
  unclear: z.array(z.string()).describe("Notes on anything in the image that couldn't be read confidently"),
});

export type ExtractedShift = z.infer<typeof ShiftSchema>;
export type ScheduleExtraction = z.infer<typeof ScheduleExtractionSchema>;

const EXTRACTION_PROMPT = `This is a photo or screenshot of a work schedule. Extract every shift you can find as a list of {date, start_time, end_time, label}.

Rules:
- date must be YYYY-MM-DD. If the year isn't shown, infer it from context (assume the nearest future occurrence of the shown month/day).
- start_time and end_time must be 24-hour HH:MM.
- label should describe the shift briefly (role, location, or shift name) as shown, or "Work shift" if nothing more specific is given.
- If a value is genuinely unreadable or ambiguous, do not guess — omit that shift and add a note to "unclear" describing what you couldn't read instead.
- confidence is your overall confidence (0 to 1) in the full extraction.`;

export type ScheduleExtractionResult =
  | { ok: true; extraction: ScheduleExtraction }
  | { ok: false; error: string };

export async function extractScheduleFromImage(
  base64Data: string,
  mimeType: string
): Promise<ScheduleExtractionResult> {
  const client = getAnthropicClient();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    output_config: { format: zodOutputFormat(ScheduleExtractionSchema), effort: "medium" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png", data: base64Data },
          },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { ok: false, error: "Couldn't read that image. Try a clearer photo or screenshot." };
  }

  return { ok: true, extraction: response.parsed_output };
}
