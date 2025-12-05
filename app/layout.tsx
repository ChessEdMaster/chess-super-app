import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { PlayerStoreSync } from "@/components/player-store-sync";
import { PresenceSync } from "@/components/presence/presence-sync";

export const metadata: Metadata = {
  title: "CHESS CLANS",
  description: "Battle, Collect, Evolve.",
};

import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-zinc-950 text-white font-sans min-h-screen flex flex-col`}
      >
        {/* Global Background Layer */}
        <div className="fixed inset-0 z-[-1]">
          <div className="absolute inset-0 bg-[url('/assets/backgrounds/main-bg.jpg')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950/90" />
        </div>

        <AuthProvider>
          <PlayerStoreSync>
            <PresenceSync />
            <MobileLayout>
              {children}
            </MobileLayout>
            <Toaster position="top-center" richColors />
          </PlayerStoreSync>
        </AuthProvider>
      </body>
    </html>
  );
}