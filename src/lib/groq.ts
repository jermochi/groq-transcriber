import Groq from "groq-sdk";

/**
 * Validate that GROQ_API_KEY is set — fail fast during development.
 * This module is server-side only. Never import from a "use client" file.
 */
if (!process.env.GROQ_API_KEY) {
    throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local to enable transcription."
    );
}

/**
 * Singleton Groq client instance.
 * Reused across all API route invocations within the same server process.
 */
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default groq;
