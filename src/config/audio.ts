/**
 * Single source of truth for all audio-related constants.
 * Import from here — do not hardcode audio values elsewhere.
 */

export const ACCEPTED_MIME_TYPES = [
    "audio/mp3",
    "audio/mp4",
    "audio/mpeg",
    "audio/mpga",
    "audio/m4a",
    "audio/wav",
    "audio/webm",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const ACCEPTED_EXTENSIONS = ".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm";

/** 25 MB in bytes */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const MAX_FILE_SIZE_LABEL = "25MB";

/** Default MIME type used when the original type is not in the allowlist */
export const FALLBACK_MIME_TYPE = "audio/webm";

/** MIME type used for MediaRecorder output */
export const RECORDER_MIME_TYPE = "audio/webm";
