import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { PlayerStoreSync } from "@/components/player-store-sync";
import { PresenceSync } from "@/components/presence/presence-sync";
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
        <div className="fixed inset-0 z-0">
          {/* Desktop Background */}
          <div className="hidden md:block absolute inset-0">
            <Image
              src="/assets/backgrounds/desktop/main-bg.png"
              alt="Background"
              fill
              className="object-cover"
              priority
              quality={100}
            />
          </div>
          {/* Mobile Background */}
          <div className="block md:hidden absolute inset-0">
            <Image
              src="/assets/backgrounds/mobile/main-bg.png"
              alt="Background"
              fill
              className="object-cover"
              priority
              quality={100}
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/20 to-slate-950/50" />
        </div>

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