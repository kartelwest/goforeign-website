import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { formatInTimeZone } from "date-fns-tz";
import { getAnthropicClient } from "./client";

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("block_range"),
    ranges: z
      .array(
        z.object({
          starts_at: z.string().describe("ISO 8601 UTC datetime"),
          ends_at: z.string().describe("ISO 8601 UTC datetime"),
          label: z.string(),
        })
      )
      .describe("One or more ranges to block, e.g. one per weekday for 'mornings this week'"),
    summary: z.string().describe("Plain-English summary of what will be blocked"),
  }),
  z.object({
    type: z.literal("open_range"),
    starts_at: z.string().describe("ISO 8601 UTC datetime"),
    ends_at: z.string().describe("ISO 8601 UTC datetime"),
    summary: z.string(),
  }),
  z.object({
    type: z.literal("query_calendar"),
    date: z.string().describe("YYYY-MM-DD"),
    summary: z.string(),
  }),
  z.object({
    type: z.literal("move_appointment"),
    client_name_hint: z.string().describe("Best guess at the client's name from the message"),
    approx_date_hint: z.string().describe("Best guess at the appointment's current date, YYYY-MM-DD"),
    new_starts_at: z.string().describe("ISO 8601 UTC datetime for the new time"),
    summary: z.string(),
  }),
  z.object({
    type: z.literal("add_note"),
    client_name_hint: z.string(),
    approx_date_hint: z.string().describe("Best guess at the appointment's date, YYYY-MM-DD, or empty if not mentioned"),
    note_body: z.string(),
    summary: z.string(),
  }),
  z.object({
    type: z.literal("unrecognized"),
    summary: z.string().describe("Explain why the request couldn't be interpreted"),
  }),
]);

export type NuNuAction = z.infer<typeof ActionSchema>;

const SYSTEM_PROMPT = (nowIso: string, timezone: string) => `You are Nu Nu, a scheduling assistant embedded in the Go Foreign backoffice. You help the owner manage their availability calendar and appointments through short text commands.

Current date/time: ${nowIso} (business timezone: ${timezone}). Compute all dates and times relative to this.

Interpret the admin's message and propose exactly ONE structured action:
- block_range — block one or more time ranges (e.g. "block next Tuesday all day", "I'm off Dec 24 through Jan 2", "block mornings this week before 11am" — for a multi-day request like that, return one range per matching day).
- open_range — remove/open a previously blocked range (e.g. "open up Saturday 9 to 1").
- query_calendar — a read-only question about the calendar (e.g. "what's on my calendar Thursday?").
- move_appointment — reschedule an existing appointment (e.g. "move my 2pm Friday to 3pm"). Never invent an appointment ID — describe it with client_name_hint and approx_date_hint so the system can look it up.
- add_note — append a note to an existing appointment (e.g. "add a note to the Johnson appointment: sent follow-up resources").
- unrecognized — if the request is ambiguous, not one of the above, or you're not confident, use this and explain why in summary.

Always write starts_at/ends_at/new_starts_at as ISO 8601 UTC datetime strings (with a trailing Z), converting from the business timezone. Always fill in "summary" with a short, plain-English description of the action for a human to confirm before it happens — never assume the action will be taken automatically.`;

export type InterpretResult = { ok: true; action: NuNuAction } | { ok: false; error: string };

export async function interpretCommand(message: string, businessTimezone: string): Promise<InterpretResult> {
  const client = getAnthropicClient();
  const nowIso = formatInTimeZone(new Date(), businessTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT(nowIso, businessTimezone),
    output_config: { format: zodOutputFormat(ActionSchema), effort: "low" },
    messages: [{ role: "user", content: message }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { ok: false, error: "I couldn't understand that request." };
  }

  return { ok: true, action: response.parsed_output };
}
