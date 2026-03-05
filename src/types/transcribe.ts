import { z } from "zod";

// --- Zod Schemas ---

export const TranscribeResponseSchema = z.object({
    text: z.string(),
});

export const TranscribeErrorSchema = z.object({
    error: z.string(),
});

// --- TypeScript Types ---

export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;
export type TranscribeError = z.infer<typeof TranscribeErrorSchema>;

export type TranscribeStatus =
    | "idle"
    | "recording"
    | "processing"
    | "success"
    | "error";

export type AudioInputMode = "record" | "upload";
