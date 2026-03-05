"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RECORDER_MIME_TYPE } from "@/config/audio";

interface RecordTabProps {
    onAudioReady: (blob: Blob) => void;
    disabled: boolean;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export function RecordTab({ onAudioReady, disabled }: RecordTabProps) {
    const [recordingState, setRecordingState] = useState<"idle" | "recording">(
        "idle"
    );
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
                    /* already stopped */
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

            const recorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType } : {}
            );
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
                onAudioReady(blob);

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

            recorder.start();
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
    }, [cleanup, onAudioReady]);

    const stopRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const isRecording = recordingState === "recording";

    return (
        <div className="flex flex-col items-center gap-6 py-8">
            {/* Pulsing ring animation styles */}
            <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>

            {/* Mic button */}
            <div className="relative">
                {isRecording && (
                    <div className="pulse-ring absolute inset-0 rounded-full bg-rose-400" />
                )}
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={disabled}
                    className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${isRecording
                            ? "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-300"
                            : "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-300"
                        }`}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    {isRecording ? (
                        <Square className="h-8 w-8" fill="currentColor" />
                    ) : (
                        <Mic className="h-10 w-10" />
                    )}
                </button>
            </div>

            {/* Label + timer */}
            {isRecording ? (
                <div className="flex flex-col items-center gap-1">
                    <p className="text-2xl font-mono font-semibold text-rose-600 tabular-nums">
                        {formatTime(elapsedSeconds)}
                    </p>
                    <p className="text-sm text-gray-500">Recording… Tap to stop</p>
                </div>
            ) : (
                <p className="text-sm text-gray-500">Tap to Record</p>
            )}

            {/* Error alert */}
            {error && (
                <Alert variant="destructive" className="w-full max-w-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
