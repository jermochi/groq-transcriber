"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RECORDER_MIME_TYPE } from "@/config/audio";

interface UseMediaRecorderReturn {
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    recordingState: "idle" | "recording";
    elapsedSeconds: number;
    error: string | null;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
    const [recordingState, setRecordingState] = useState<"idle" | "recording">(
        "idle"
    );
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onStopResolveRef = useRef<((blob: Blob) => void) | null>(null);

    // Clean up all resources
    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== "inactive") {
                try {
                    mediaRecorderRef.current.stop();
                } catch {
                    // Already stopped — ignore
                }
            }
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        chunksRef.current = [];
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const startRecording = useCallback(async () => {
        setError(null);
        cleanup();

        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Your browser does not support audio recording.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported(RECORDER_MIME_TYPE)
                ? RECORDER_MIME_TYPE
                : "";

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mimeType || "audio/webm",
                });
                chunksRef.current = [];

                if (onStopResolveRef.current) {
                    onStopResolveRef.current(blob);
                    onStopResolveRef.current = null;
                }

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }

                // Clear timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                setRecordingState("idle");
            };

            recorder.start();
            setRecordingState("recording");
            setElapsedSeconds(0);

            // Start elapsed seconds timer
            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } catch (err: unknown) {
            cleanup();
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setError(
                    "Microphone access was denied. Please allow microphone access in your browser settings."
                );
            } else {
                setError("Failed to start recording. Please try again.");
            }
        }
    }, [cleanup]);

    const stopRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return {
        startRecording,
        stopRecording,
        recordingState,
        elapsedSeconds,
        error,
    };
}

/**
 * Extended version that returns a promise resolving to the recorded Blob.
 * Used internally by RecordTab to get the blob after stop.
 */
export function useMediaRecorderWithBlob() {
    const recorder = useMediaRecorder();
    const onStopResolveRef = useRef<((blob: Blob) => void) | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [recordingState, setRecordingState] = useState<"idle" | "recording">(
        "idle"
    );
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const latestBlobRef = useRef<Blob | null>(null);

    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== "inactive") {
                try {
                    mediaRecorderRef.current.stop();
                } catch {
                    // ignore
                }
            }
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        chunksRef.current = [];
    }, []);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const startRecording = useCallback(async () => {
        setError(null);
        latestBlobRef.current = null;
        cleanup();

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Your browser does not support audio recording.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported(RECORDER_MIME_TYPE)
                ? RECORDER_MIME_TYPE
                : "";

            const rec = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            mediaRecorderRef.current = rec;
            chunksRef.current = [];

            rec.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            rec.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mimeType || "audio/webm",
                });
                chunksRef.current = [];
                latestBlobRef.current = blob;

                if (onStopResolveRef.current) {
                    onStopResolveRef.current(blob);
                    onStopResolveRef.current = null;
                }

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                setRecordingState("idle");
            };

            rec.start();
            setRecordingState("recording");
            setElapsedSeconds(0);

            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } catch (err: unknown) {
            cleanup();
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setError(
                    "Microphone access was denied. Please allow microphone access in your browser settings."
                );
            } else {
                setError("Failed to start recording. Please try again.");
            }
        }
    }, [cleanup]);

    const stopRecording = useCallback((): Promise<Blob> => {
        return new Promise((resolve) => {
            onStopResolveRef.current = resolve;
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === "recording"
            ) {
                mediaRecorderRef.current.stop();
            }
        });
    }, []);

    // Suppress unused variable warning — recorder is used for type reference
    void recorder;

    return {
        startRecording,
        stopRecording,
        recordingState,
        elapsedSeconds,
        error,
        latestBlob: latestBlobRef.current,
    };
}
