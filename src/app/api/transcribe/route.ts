import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { del } from "@vercel/blob";
import { transcribeAudio } from "@/lib/transcribe";

// ---------------------------------------------------------------------------
// Rate limiter — sliding window, 10 requests per minute per IP
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = requestLog.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        requestLog.set(ip, recent);
        return true;
    }

    recent.push(now);
    requestLog.set(ip, recent);
    return false;
}

// ---------------------------------------------------------------------------
// Zod schema for incoming JSON validation
// ---------------------------------------------------------------------------

const TranscribeSchema = z.object({
    blobUrl: z.string().url({ message: "A valid blob URL is required." }),
});

// ---------------------------------------------------------------------------
// POST handler — thin controller
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    let blobUrl: string | undefined;

    try {
        // 1. Rate limiting
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip") ??
            "unknown";

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // 2. Parse and Validate JSON
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request body." },
                { status: 400 }
            );
        }

        const parsed = TranscribeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Invalid input." },
                { status: 400 }
            );
        }

        blobUrl = parsed.data.blobUrl;

        // 3. Fetch file from Blob URL
        const fileResponse = await fetch(blobUrl);
        if (!fileResponse.ok) {
            throw new Error("Failed to fetch audio file from blob storage.");
        }

        const blob = await fileResponse.blob();
        const filename = blobUrl.split("/").pop() || "audio.webm";
        const file = new File([blob], filename, { type: blob.type });

        // 4. Transcribe
        const text = await transcribeAudio(file);

        // 5. Cleanup — Delete from Vercel Blob
        try {
            await del(blobUrl);
        } catch (delError) {
            // Log deletion failure but don't fail the request
            console.error("[POST /api/transcribe] Cleanup failed:", delError);
        }

        return NextResponse.json({ text });
    } catch (error: unknown) {
        console.error("[POST /api/transcribe] Unhandled error:", error);

        // Attempt cleanup on error as well
        if (blobUrl) {
            try {
                await del(blobUrl);
            } catch {
                // Ignore cleanup errors during main error handling
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An internal error occurred." },
            { status: 500 }
        );
    }
}
