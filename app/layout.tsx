import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper";
import { AuthProvider } from "@/lib/AuthContext";
import { DarkModeProvider } from "@/lib/DarkModeContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "BODHI Capital · Member Portal",
  description: "Internal portal for BODHI Capital investment club members.",
  icons: {
    icon: "/bodhi.png",
    apple: "/bodhi.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-white text-[#0f172a] antialiased">
        <DarkModeProvider>
          <AuthProvider>
            <SidebarWrapper>{children}</SidebarWrapper>
          </AuthProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
