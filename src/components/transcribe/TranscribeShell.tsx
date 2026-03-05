"use client";

import { useCallback } from "react";
import { Mic, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranscribe } from "@/hooks/useTranscribe";
import { RecordTab } from "@/components/transcribe/RecordTab";
import { UploadTab } from "@/components/transcribe/UploadTab";
import { ResultCard } from "@/components/transcribe/ResultCard";
import { StatusMessage } from "@/components/transcribe/StatusMessage";
import type { AudioInputMode } from "@/types/transcribe";

export function TranscribeShell() {
    const { transcribe, status, transcript, error, reset } = useTranscribe();

    const handleAudioReady = useCallback(
        (blob: Blob) => {
            const file = new File([blob], "recording.webm", { type: "audio/webm" });
            transcribe(file);
        },
        [transcribe]
    );

    const handleFileReady = useCallback(
        (file: File) => {
            transcribe(file);
        },
        [transcribe]
    );

    const isProcessing = status === "processing";

    return (
        <div className="mx-auto w-full max-w-lg px-4 py-6">
            <Tabs defaultValue={"record" satisfies AudioInputMode}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="record" disabled={isProcessing} className="gap-2">
                        <Mic className="h-4 w-4" />
                        Record
                    </TabsTrigger>
                    <TabsTrigger value="upload" disabled={isProcessing} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="record">
                    <RecordTab
                        onAudioReady={handleAudioReady}
                        disabled={isProcessing}
                    />
                </TabsContent>

                <TabsContent value="upload">
                    <UploadTab
                        onFileReady={handleFileReady}
                        disabled={isProcessing}
                    />
                </TabsContent>
            </Tabs>

            {/* Status: loading spinner or error */}
            <StatusMessage status={status} error={error} />

            {/* Result card */}
            {transcript && (
                <ResultCard transcript={transcript} onClear={reset} />
            )}
        </div>
    );
}
