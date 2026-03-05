"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TranscribeStatus } from "@/types/transcribe";

interface StatusMessageProps {
    status: TranscribeStatus;
    error: string | null;
}

export function StatusMessage({ status, error }: StatusMessageProps) {
    if (status === "processing") {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-sm font-medium text-teal-700">Transcribing…</p>
            </div>
        );
    }

    if (status === "error" && error) {
        return (
            <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return null;
}
