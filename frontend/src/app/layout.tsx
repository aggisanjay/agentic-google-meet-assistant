import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import { AuthProvider } from "@descope/nextjs-sdk";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agentic Meet | AI Calendar & Meeting Assistant",
  description:
    "Autonomous meeting and calendar management assistant powered by Google Gemini, Mastra, and Descope.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID ?? "";

  const cookieOptions = {
    sameSite: "Lax" as const,
    secure: process.env.NODE_ENV !== "development",
  };

  return (
    <AuthProvider
      projectId={projectId}
      sessionTokenViaCookie={cookieOptions}
      refreshTokenViaCookie={cookieOptions}
    >
          <html lang="en" className={cn("dark font-sans")}>
            <body className="min-h-svh bg-background font-sans text-foreground antialiased selection:bg-[#2bd98a]/25 selection:text-white">
              {children}
            </body>
          </html>
        </AuthProvider>
        );
}
