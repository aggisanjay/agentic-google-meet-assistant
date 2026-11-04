"use client";

import { ConnectionInfo } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { CalendarDays, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  connectCalendar,
  fetchCalendarConnection,
  refreshCalendarConnection,
} from "@/lib/connections";

const styles = {
  root: "space-y-2",
  title: "px-1 text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--lp-mute)]",
  error: "text-xs text-[rgb(var(--lp-red))]",
  skeleton: "h-12 w-full rounded-xl bg-white/[0.04]",
  row: "flex items-center gap-2.5 rounded-xl border hairline bg-white/[0.03] px-3 py-2.5 transition-all hover:bg-white/[0.05]",
  iconBox: "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs",
  iconBoxConnected: "bg-[rgb(var(--lp-green))]/15 text-[rgb(var(--lp-green))] border border-[rgb(var(--lp-green))]/30",
  iconBoxDisconnected: "bg-white/[0.04] text-[var(--lp-mute)] border hairline",
  icon: "size-4",
  meta: "min-w-0 flex-1",
  label: "truncate text-[13px] font-medium text-white leading-tight",
  status: "mt-0.5 text-[11px] font-mono",
  statusConnected: "text-[rgb(var(--lp-green))]",
  statusDisconnected: "text-[var(--lp-mute)]",
  actionBtn: "h-7 shrink-0 rounded-full px-3 text-[11.5px] font-medium transition-all active:scale-95",
  actionBtnConnected: "border hairline text-[var(--lp-mute)] hover:text-white hover:bg-white/[0.06]",
  actionBtnDisconnected: "bg-[rgb(var(--lp-green))] text-[#04130b] hover:brightness-110 font-semibold shadow-xs",
  refreshBtn: "size-7 shrink-0 rounded-lg text-[var(--lp-mute)] hover:text-white hover:bg-white/[0.06] transition-colors",
  refreshIcon: "size-3.5",
} as const;

function statusLabel(status: ConnectionInfo["status"]) {
  if (status === "connected") return "Connected";
  if (status === "pending") return "Pending";

  return "Not Connected";
}

function ConnectionsPanel({ sessionToken }: { sessionToken: string }) {
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleLoadCalendarConnection = useCallback(async () => {
    setLoading(true);

    try {
      setConnection(await fetchCalendarConnection(sessionToken));
    } catch {
      console.log("failed to load calendar connection");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    handleLoadCalendarConnection();
  }, [handleLoadCalendarConnection]);

  async function handleCalendarConnect() {
    setBusy(true);
    try {
      await connectCalendar(sessionToken);
    } catch (err) {
      console.error("failed to connect:", err);
    } finally {
      setBusy(false);
    }
  }

  async function handleCalendarRefresh() {
    setBusy(true);

    try {
      await refreshCalendarConnection(sessionToken);
      await handleLoadCalendarConnection();
    } catch (err) {
      console.error("failed to refresh:", err);
    } finally {
      setBusy(false);
    }
  }

  const connected = connection?.status === "connected";

  return (
    <div className={styles.root}>
      <p className={styles.title}>Connections</p>

      {loading || !connection ? (
        <Skeleton className={styles.skeleton} />
      ) : (
        <div className={styles.row}>
          <div
            className={cn(
              styles.iconBox,
              connected ? styles.iconBoxConnected : styles.iconBoxDisconnected,
            )}
          >
            <CalendarDays className={styles.icon} />
          </div>
          <div className={styles.meta}>
            <p className={styles.label}>{connection.label}</p>

            <p
              className={cn(
                styles.status,
                connected ? styles.statusConnected : styles.statusDisconnected,
              )}
            >
              {statusLabel(connection.status)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              styles.actionBtn,
              connected ? styles.actionBtnConnected : styles.actionBtnDisconnected,
            )}
            disabled={busy}
            onClick={() => handleCalendarConnect()}
          >
            {connected ? "Reconnect" : "Connect"}
          </Button>

          <Button
            size="icon-sm"
            variant="ghost"
            className={styles.refreshBtn}
            disabled={busy}
            onClick={() => handleCalendarRefresh()}
            title="Refresh connection status"
          >
            <RefreshCcw className={cn(styles.refreshIcon, busy && "animate-spin")} />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ConnectionsPanel;
