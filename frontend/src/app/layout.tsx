import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@descope/nextjs-sdk";
import { cn } from "@/lib/utils";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Agentic Calendar Assistant | AI Meeting Orchestrator",
  description:
    "Autonomous meeting and calendar management assistant powered by Google Gemini, Mastra, and Descope.",
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
      <html lang="en" className={cn(sans.variable, "font-sans")}>
        <body className="min-h-svh bg-background font-sans text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
