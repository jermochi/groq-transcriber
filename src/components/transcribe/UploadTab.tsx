"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileAudio, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatFileSize } from "@/lib/audio";
import {
    ACCEPTED_EXTENSIONS,
    ACCEPTED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_LABEL,
} from "@/config/audio";

interface UploadTabProps {
    onFileReady: (file: File) => void;
    disabled: boolean;
}

export function UploadTab({ onFileReady, disabled }: UploadTabProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): string | null => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return `File is too large (${formatFileSize(file.size)}). Maximum size is ${MAX_FILE_SIZE_LABEL}.`;
        }

        if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
            return `Unsupported format "${file.type || "unknown"}". Accepted: ${ACCEPTED_EXTENSIONS}`;
        }

        return null;
    }, []);

    const handleFile = useCallback(
        (file: File) => {
            setError(null);
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
        },
        [validateFile]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) setDragActive(true);
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            if (disabled) return;

            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [disabled, handleFile]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Reset input so the same file can be re-selected
            e.target.value = "";
        },
        [handleFile]
    );

    const handleTranscribe = useCallback(() => {
        if (selectedFile) {
            onFileReady(selectedFile);
            setSelectedFile(null);
        }
    }, [selectedFile, onFileReady]);

    return (
        <div className="flex flex-col items-center gap-4 py-6">
            {/* Drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors duration-200 ${disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-50"
                        : dragActive
                            ? "border-teal-500 bg-teal-50"
                            : "border-teal-300 bg-white hover:border-teal-400 hover:bg-teal-50/50"
                    }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!disabled) inputRef.current?.click();
                    }
                }}
                aria-label="Upload audio file"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                    <Upload className="h-6 w-6 text-teal-600" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        Drag &amp; drop or tap to browse
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                        Accepted: {ACCEPTED_EXTENSIONS}
                    </p>
                    <p className="text-xs text-gray-400">Max size: {MAX_FILE_SIZE_LABEL}</p>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleInputChange}
                className="hidden"
                aria-hidden="true"
            />

            {/* Selected file info */}
            {selectedFile && (
                <div className="flex w-full items-center gap-3 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
                    <FileAudio className="h-5 w-5 shrink-0 text-teal-600" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleTranscribe}
                        disabled={disabled}
                        className="shrink-0 bg-teal-600 text-white hover:bg-teal-700"
                    >
                        Transcribe
                    </Button>
                </div>
            )}

            {/* Error */}
            {error && (
                <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
