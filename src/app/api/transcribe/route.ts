import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transcribeAudio } from "@/lib/transcribe";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from "@/config/audio";

// ---------------------------------------------------------------------------
// Rate limiter — sliding window, 10 requests per minute per IP
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

/** Map of IP → array of request timestamps */
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = requestLog.get(ip) ?? [];

    // Remove timestamps outside the sliding window
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
// Zod schema for incoming FormData validation
// ---------------------------------------------------------------------------

const FormDataSchema = z.object({
    file: z.instanceof(File, { message: "An audio file is required." }),
});

// ---------------------------------------------------------------------------
// POST handler — thin controller
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
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

        // 2. Parse FormData
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json(
                { error: "Invalid request body." },
                { status: 400 }
            );
        }

        // 3. Zod validate
        const parsed = FormDataSchema.safeParse({
            file: formData.get("file"),
        });

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Invalid input." },
                { status: 400 }
            );
        }

        const { file } = parsed.data;

        // 4. File size check
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: `File size exceeds the ${MAX_FILE_SIZE_LABEL} limit.` },
                { status: 413 }
            );
        }

        // 5. MIME type allowlist
        if (
            !(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)
        ) {
            return NextResponse.json(
                {
                    error: `Unsupported audio format "${file.type}". Accepted formats: ${ACCEPTED_MIME_TYPES.join(", ")}.`,
                },
                { status: 415 }
            );
        }

        // 6. Transcribe
        const text = await transcribeAudio(file);

        return NextResponse.json({ text });
    } catch (error: unknown) {
        // Log full error server-side
        console.error("[POST /api/transcribe] Unhandled error:", error);

        // Return sanitized error — never leak stack traces
        return NextResponse.json(
            { error: "An internal error occurred. Please try again." },
            { status: 500 }
        );
    }
}
