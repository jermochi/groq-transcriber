"use client";

import { useState, useCallback } from "react";
import { ClipboardCopy, Check, Trash2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
    transcript: string;
    onClear: () => void;
}

export function ResultCard({ transcript, onClear }: ResultCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(transcript);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API may fail in some contexts — silently fail
        }
    }, [transcript]);

    return (
        <Card className="mt-4 border-teal-200">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                    <ClipboardCopy className="h-4 w-4 text-teal-600" />
                    Transcription
                </CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="gap-1.5 text-xs"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-teal-600" />
                                Copied
                            </>
                        ) : (
                            <>
                                <ClipboardCopy className="h-3.5 w-3.5" />
                                Copy
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClear}
                        className="gap-1.5 text-xs text-rose-500 hover:text-rose-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[40vh] overflow-y-auto rounded-md bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                        {transcript}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
