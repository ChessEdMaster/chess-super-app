import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { PlayerStoreSync } from "@/components/player-store-sync";
import { PresenceSync } from "@/components/presence/presence-sync";
import { GlobalBackground } from "@/components/global-background";
import Image from "next/image";
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: "CHESS CLANS",
  description: "Battle, Collect, Evolve.",
};

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
        <GlobalBackground />

        {/* Content Wrapper */}
        <div className="relative z-10 flex-1 flex flex-col h-full">
          <AuthProvider>
            <PlayerStoreSync>
              <PresenceSync />
              <MobileLayout>
                {children}
              </MobileLayout>
              <Toaster position="top-center" richColors />
            </PlayerStoreSync>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}