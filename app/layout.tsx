import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { PlayerStoreSync } from "@/components/player-store-sync";

export const metadata: Metadata = {
  title: "Chess Royale",
  description: "Battle, Collect, Evolve.",
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-zinc-950 text-white font-sans`}
      >
        <AuthProvider>
          <PlayerStoreSync>
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