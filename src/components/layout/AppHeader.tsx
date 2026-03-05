import { Stethoscope } from "lucide-react";

export function AppHeader() {
    return (
        <header className="sticky top-0 z-50 w-full bg-teal-600 shadow-md">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white">
                        MediScribe
                    </h1>
                    <p className="text-xs text-teal-100">Powered by Groq Whisper</p>
                </div>
            </div>
        </header>
    );
}
