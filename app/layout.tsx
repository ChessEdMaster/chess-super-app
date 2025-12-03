import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { PlayerStoreSync } from "@/components/player-store-sync";

export const metadata: Metadata = {
  title: "Chess Royale",
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
        className={`antialiased bg-zinc-950 text-white font-sans`}
      >
        <AuthProvider>
          <PlayerStoreSync>
            <MobileLayout>
              {children}
            </MobileLayout>
          </PlayerStoreSync>
        </AuthProvider>
      </body>
    </html>
  );
}