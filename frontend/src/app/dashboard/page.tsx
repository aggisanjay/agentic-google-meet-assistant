"use client";

import ChatPanel from "@/components/dashboard/chat-panel";
import ConnectionsPanel from "@/components/dashboard/connection-panel";
import { Button } from "@/components/ui/button";
import { useDescope, useSession, useUser } from "@descope/nextjs-sdk/client";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const styles = {
  loadingShell:
  "app-shell-bg flex h-svh items-center justify-center text-sm text-[var(--lp-mute)] font-mono gap-2",
  shell: "app-shell-bg min-h-svh text-foreground",
  userLabel: "mb-2 truncate px-2 text-xs font-mono text-[var(--lp-mute)]",
  logoutBtn:
  "w-full justify-start gap-2 rounded-xl text-xs text-[var(--lp-mute)] hover:bg-white/[0.06] hover:text-white transition-colors",
  logoutIcon: "size-3.5 text-[var(--lp-mute)]",
} as const;

function DashboardPage() {
  const sdk = useDescope();
  const router = useRouter();
  const { isAuthenticated, sessionToken, isSessionLoading } = useSession();
  const { user, isUserLoading } = useUser();
  const [loggingOut, setLoggingout] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [isSessionLoading, isAuthenticated, router]);

  const label = user?.email || user?.name || "Signed in User";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingout(true);

    try {
      await sdk.logout();
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setLoggingout(false);
    }
  }

  if (!isAuthenticated || !sessionToken) {
    return (
      <div className={styles.loadingShell}>
        <LoaderCircle className="size-4 animate-spin text-[rgb(var(--lp-green))]" />
        Checking session...
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <ChatPanel
        sessionToken={sessionToken}
        connections={<ConnectionsPanel sessionToken={sessionToken} />}
        footer={
          <>
            <div className={styles.userLabel}>
              {isUserLoading ? "Loading..." : label}
            </div>
            <Button
              variant="ghost"
              className={styles.logoutBtn}
              disabled={loggingOut}
              onClick={() => handleLogout()}
            >
              <LogOut className={styles.logoutIcon} />
              {loggingOut ? "Logging out..." : "Log out"}
            </Button>
          </>
        }
      />
    </div>
  );
}

export default DashboardPage;
