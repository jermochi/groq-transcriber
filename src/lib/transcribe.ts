import groq from "@/lib/groq";
import { normalizeAudioFile } from "@/lib/audio";

/**
 * Core transcription service.
 * Normalizes the audio file, sends it to Groq Whisper, and returns the text.
 *
 * This module is server-side only. Never import from a "use client" file.
 * All Groq SDK errors are caught and re-thrown as generic Error instances
 * to prevent raw SDK internals from leaking to the client.
 */
export async function transcribeAudio(file: File): Promise<string> {
    const normalizedFile = normalizeAudioFile(file);

    try {
        const transcription = await groq.audio.transcriptions.create({
            file: normalizedFile,
            model: "whisper-large-v3",
        });

        return transcription.text;
    } catch (error: unknown) {
        // Log the full error server-side for debugging
        console.error("[transcribeAudio] Groq transcription failed:", error);

        // Re-throw a sanitized error — no SDK internals leak out
        if (error instanceof Error) {
            throw new Error(`Transcription failed: ${error.message}`);
        }

        throw new Error("Transcription failed due to an unexpected error.");
    }
}
