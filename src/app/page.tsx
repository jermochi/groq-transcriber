import { AppHeader } from "@/components/layout/AppHeader";
import { TranscribeShell } from "@/components/transcribe/TranscribeShell";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />
      <TranscribeShell />
    </main>
  );
}
