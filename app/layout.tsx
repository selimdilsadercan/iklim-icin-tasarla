import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { BetaProvider } from "@/contexts/BetaContext";
import StatusBarComponent from "@/components/StatusBar";
import BackButtonHandler from "@/components/BackButtonHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "İklim İçin Tasarla",
  description: "İklim değişikliği için tasarım platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StatusBarComponent />
        <BackButtonHandler />
        <BetaProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BetaProvider>
      </body>
    </html>
  );
}
