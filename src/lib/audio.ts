import {
    ACCEPTED_MIME_TYPES,
    FALLBACK_MIME_TYPE,
    type AcceptedMimeType,
} from "@/config/audio";

/**
 * Normalize an audio file's MIME type.
 * If the file already has an accepted MIME type, return it as-is.
 * Otherwise, re-wrap it with the fallback MIME type and a safe filename.
 */
export function normalizeAudioFile(file: File): File {
    const isAccepted = (ACCEPTED_MIME_TYPES as readonly string[]).includes(
        file.type
    );

    if (isAccepted) {
        return file;
    }

    // Re-wrap with fallback MIME type and safe filename
    return new File([file], "audio.webm", {
        type: FALLBACK_MIME_TYPE as AcceptedMimeType,
    });
}

/**
 * Format a byte count into a human-readable string.
 * Examples: "340 KB", "1.2 MB", "25.0 MB"
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);

    // Show decimals only for MB and above
    const formatted = i >= 2 ? size.toFixed(1) : Math.round(size).toString();

    return `${formatted} ${units[i]}`;
}
