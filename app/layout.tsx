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
        className={`antialiased text-white font-sans min-h-screen flex flex-col`}
      >
        {/* Global Background Layer */}
        <div className="fixed inset-0 z-[-1]">
          <div className="absolute inset-0 bg-indigo-950 bg-[url('/assets/backgrounds/mobile/main-bg.png')] md:bg-[url('/assets/backgrounds/desktop/main-bg.png')] bg-cover bg-center transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/20 to-slate-950/50" />
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