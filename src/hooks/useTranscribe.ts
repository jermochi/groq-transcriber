"use client";

import { useState, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import { sanitizeFilename } from "@/lib/utils";
import {
    TranscribeResponseSchema,
    type TranscribeStatus,
} from "@/types/transcribe";

interface UseTranscribeReturn {
    transcribe: (file: File) => Promise<void>;
    status: TranscribeStatus;
    transcript: string | null;
    error: string | null;
    reset: () => void;
}

export function useTranscribe(): UseTranscribeReturn {
    const [status, setStatus] = useState<TranscribeStatus>("idle");
    const [transcript, setTranscript] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setStatus("idle");
        setTranscript(null);
        setError(null);
    }, []);

    const transcribe = useCallback(async (file: File) => {
        setStatus("processing");
        setTranscript(null);
        setError(null);

        try {
            // 1. Sanitize filename
            const sanitizedName = sanitizeFilename(file.name);
            const sanitizedFile = new File([file], sanitizedName, { type: file.type });

            // 2. Upload to Vercel Blob
            const blob = await upload(sanitizedName, sanitizedFile, {
                access: "public",
                handleUploadUrl: "/api/upload",
            });

            // 3. Send blob URL to transcription API
            const response = await fetch("/api/transcribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ blobUrl: blob.url }),
            });

            const json: unknown = await response.json();

            if (!response.ok) {
                // Try to extract error message from response
                const errorMessage =
                    json &&
                        typeof json === "object" &&
                        "error" in json &&
                        typeof (json as Record<string, unknown>).error === "string"
                        ? (json as Record<string, string>).error
                        : "Transcription failed. Please try again.";

                setError(errorMessage);
                setStatus("error");
                return;
            }

            // Validate response shape with Zod
            const parsed = TranscribeResponseSchema.safeParse(json);

            if (!parsed.success) {
                setError("Received an invalid response from the server.");
                setStatus("error");
                return;
            }

            setTranscript(parsed.data.text);
            setStatus("success");
        } catch (e) {
            console.error("Transcription error:", e);
            setError("Transcription failed. Please try again.");
            setStatus("error");
        }
    }, []);

    return {
        transcribe,
        status,
        transcript,
        error,
        reset,
    };
}
