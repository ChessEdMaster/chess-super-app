import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/components/auth-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { PlayerStoreSync } from "@/components/player-store-sync";
import { PresenceSync } from "@/components/presence/presence-sync";
import { GlobalBackground } from "@/components/global-background";
import Image from "next/image";
import { Toaster } from '@/components/ui/sonner';
import { AssistantWidget } from "@/components/ai/assistant-widget";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/splash-screen";

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
        className={`antialiased font-sans min-h-screen flex flex-col`}
      >
        {/* Global Background Layer */}
        <GlobalBackground />

        {/* Content Wrapper */}
        <div className="relative z-10 flex-1 flex flex-col h-full">
          <AuthProvider>
            <PlayerStoreSync>
              <PresenceSync />
              <ThemeProvider>
                <MobileLayout>
                  <SplashScreen />
                  {children}
                </MobileLayout>
                <AssistantWidget />
                <Toaster position="top-center" richColors />
              </ThemeProvider>
            </PlayerStoreSync>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}