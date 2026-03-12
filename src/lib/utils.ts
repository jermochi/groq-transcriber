import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize a filename by removing special characters and whitespace.
 * Replaces non-alphanumeric characters (except dots and dashes) with underscores.
 */
export function sanitizeFilename(filename: string): string {
    const nameParts = filename.split(".");
    const extension = nameParts.length > 1 ? nameParts.pop() : "";
    const baseName = nameParts.join(".");

    const sanitizedBase = baseName
        .replace(/[^a-zA-Z0-9.\-]/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_|_$/g, "");

    return extension ? `${sanitizedBase}.${extension}` : sanitizedBase;
}
