"use client";

import {
  ArrowUp,
  LoaderCircle,
  MessageSquarePlus,
  Sparkles,
  Trash2,
  ShieldCheck,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Video,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  deleteThread,
  listThreads,
  loadThread,
  streamAgentChat,
  ThreadSummary,
  SourceProvenance,
  TelemetryData,
} from "@/lib/agent";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";

const styles = {
  root: "lp flex h-svh overflow-hidden bg-[#07090a] text-[#e8efea]",
  overlay: "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden",
  aside:
  "fixed inset-y-0 left-0 z-40 flex w-[18.5rem] flex-col border-r hairline bg-[#090d0e]/95 backdrop-blur-xl transition-transform md:static md:translate-x-0",
  asideOpen: "translate-x-0",
  asideClosed: "-translate-x-full",
  brandRow: "flex items-center justify-between gap-2 px-4 pt-4 pb-3",
  brandLeft: "flex min-w-0 items-center gap-2.5",
  brandIcon:
  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--lp-green))] text-[#04130b] shadow-sm",
  brandIconSvg: "size-4",
  brandText: "min-w-0",
  brandTitle: "font-sans text-[15px] font-semibold tracking-tight text-white",
  brandSubtitle: "truncate text-[11px] font-mono text-[var(--lp-mute)]",
  mobileCloseBtn: "md:hidden",
  topActions: "space-y-3 px-3 pb-3",
  newChatBtn:
  "w-full justify-start gap-2 rounded-xl border hairline bg-white/[0.04] text-[13px] font-medium text-[#e8efea] shadow-xs hover:bg-white/[0.08] hover:text-white transition-all",
  newChatIcon: "size-3.5",
  separator: "border-white/10 opacity-70",
  chatsSection: "flex min-h-0 flex-1 flex-col px-2 pt-3",
  chatsTitle: "mb-2 px-2 text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--lp-mute)]",
  chatsScroll: "min-h-0 flex-1 px-1 pb-3",
  chatsEmpty: "px-2 py-3 text-xs leading-relaxed text-[var(--lp-mute)]",
  threadList: "space-y-1",
  threadTitle: "line-clamp-2 text-[13px] font-medium leading-snug",
  threadTime: "mt-0.5 block text-[11px] font-mono text-[var(--lp-mute)]",
  footer: "mt-auto border-t hairline p-3",
  main: "relative flex min-w-0 flex-1 flex-col bg-[#07090a]",
  header:
  "flex h-14 shrink-0 items-center justify-between border-b hairline bg-[#07090a]/80 px-4 backdrop-blur-md md:px-6",
  headerLeft: "flex min-w-0 items-center gap-3",
  headerTitle: "truncate text-sm font-semibold text-white",
  headerSubtitle: "truncate text-xs text-[var(--lp-mute)]",
  timezonePill:
  "hidden sm:flex items-center gap-1.5 rounded-full border hairline bg-white/[0.03] px-3 py-1 text-xs text-[var(--lp-mute)] font-mono",
  chatColumn: "relative flex min-h-0 flex-1 flex-col",
  messagesScroll: "h-full min-h-0 flex-1",
  messagesInner: "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6",
  emptyState:
    "flex min-h-[52vh] flex-col items-center justify-center text-center",
  emptyIcon:
  "mb-5 flex size-12 items-center justify-center rounded-2xl bg-[rgb(var(--lp-green))]/10 border border-[rgb(var(--lp-green))]/25 text-[rgb(var(--lp-green))] shadow-sm",
  emptyIconSvg: "size-5",
  emptyTitle: "display text-3xl font-semibold tracking-tight text-white sm:text-4xl",
  emptyCopy: "mt-3 max-w-md text-sm leading-relaxed text-[var(--lp-mute)]",
  suggestions: "mt-8 flex flex-wrap justify-center gap-2 max-w-2xl",
  suggestionBtn: "rounded-full border hairline bg-white/[0.03] px-3.5 py-1.5 text-xs text-[#b9c6bf] hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-95",
  messageList: "space-y-5",
  statusRow: "flex items-center gap-2 text-xs font-mono text-[var(--lp-mute)] py-2",
  statusIconSm: "size-3.5 animate-spin text-[rgb(var(--lp-green))]",
  messageRow: "message-enter flex flex-col w-full min-w-0",
  messageRowUser: "items-end",
  messageRowAssistant: "items-start",
  bubble:
    "min-w-0 max-w-[min(100%,42rem)] overflow-hidden break-words [overflow-wrap:anywhere]",
  bubbleUser:
  "rounded-2xl rounded-br-md bg-[#e8efea] px-4 py-2.5 text-[14.5px] text-[#07090a] font-normal shadow-sm",
  bubbleAssistant:
  "rounded-2xl rounded-bl-md border hairline bg-white/[0.035] px-4 py-3 text-[#dbe5df] shadow-xs",
  bubbleSystem: "rounded-2xl border hairline bg-white/[0.02] px-4 py-2.5 text-[13px] text-[var(--lp-mute)] font-mono",
  thinking: "inline-flex items-center gap-2 text-xs font-mono text-[var(--lp-mute)]",
  userText: "whitespace-pre-wrap text-[14.5px] leading-relaxed",
  composerWrap:
  "shrink-0 border-t hairline bg-[#07090a]/85 px-4 py-4 backdrop-blur-md sm:px-6",
  composerForm:
  "composer-glow mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border hairline bg-white/[0.03] p-2.5 transition-all focus-within:border-white/20",
  composerInput:
  "max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[14.5px] text-[#e8efea] placeholder:text-[var(--lp-mute)] shadow-none focus-visible:ring-0",
  sendBtn: "mb-0.5 size-10 shrink-0 rounded-xl bg-[rgb(var(--lp-green))] text-[#04130b] hover:brightness-110 active:scale-95 transition-all shadow-sm",
  stopBtn: "mb-0.5 size-10 shrink-0 rounded-xl bg-[rgb(var(--lp-red))] text-white hover:brightness-110 active:scale-95 transition-all",
  sendIcon: "size-4",
  sendIconSpin: "size-4 animate-spin",
  provenanceWrap: "mt-2.5 flex flex-wrap items-center gap-2",
  provenanceBadge:
  "inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--lp-green))]/30 bg-[rgb(var(--lp-green))]/[0.08] px-2.5 py-1 text-[11px] font-mono text-[rgb(var(--lp-green))]",
  provenanceCalculatedBadge:
  "inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--lp-amber))]/30 bg-[rgb(var(--lp-amber))]/[0.08] px-2.5 py-1 text-[11px] font-mono text-[rgb(var(--lp-amber))]",
  telemetryBadge:
  "inline-flex items-center gap-1 rounded-full border hairline bg-white/[0.03] px-2.5 py-1 text-[10px] text-[var(--lp-mute)] font-mono",
} as const;

type Props = {
  sessionToken: string;
  connections?: ReactNode;
  footer?: ReactNode;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provenances?: SourceProvenance[];
  telemetry?: TelemetryData;
};

const WELCOME =
  "Connect Google Calendar, then ask about today's agenda, check availability, create a Meet, or reschedule something.";

const SUGGESTIONS = [
  "What's on today?",
  "Find a free slot tomorrow afternoon",
  "Schedule Team Sync with alice@example.com tomorrow at 3pm",
  "Do I have any conflicts on Friday?",
];

function WelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME,
  };
}

function ChatPanel({ sessionToken, connections, footer }: Props) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([WelcomeMessage()]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [expandedProv, setExpandedProv] = useState<Record<string, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const userTimezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  const showEmpty =
    messages.length === 1 && messages[0]?.id === "welcome" && !running;

  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await listThreads(sessionToken);
      setThreads(data.threads);
    } catch { }
  }, [sessionToken]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progress]);

  async function handleDeleteThread(targetThreadId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (deletingThreadId || running) return;

    setDeletingThreadId(targetThreadId);
    try {
      await deleteThread(sessionToken, targetThreadId);
      setThreads((current) => current.filter((t) => t.id !== targetThreadId));

      if (threadId === targetThreadId) {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat thread:", err);
    } finally {
      setDeletingThreadId(null);
    }
  }

  function startNewChat() {
    if (running) {
      handleStopGenerating();
    }
    setThreadId(crypto.randomUUID());
    setMessages([WelcomeMessage()]);
    setPrompt("");
  }

  async function resumeThread(nextThreadId: string) {
    if (running || loadingThread || nextThreadId === threadId) return;
    setLoadingThread(true);
    setProgress(null);

    try {
      const data = await loadThread(sessionToken, nextThreadId);
      setThreadId(data.threadId);
      setMessages(
        data.messages.length > 0
          ? data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            provenances: m.provenance,
            telemetry: m.telemetry,
          }))
          : [WelcomeMessage()],
      );
      setPrompt("");
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Could not load the chat conversation.",
        },
      ]);
    } finally {
      setLoadingThread(false);
    }
  }

  function handleStopGenerating() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setRunning(false);
    setProgress(null);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || running || loadingThread) return;

    const assistantId = crypto.randomUUID();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        provenances: [],
      },
    ]);

    setPrompt("");
    setRunning(true);
    setProgress(null);

    try {
      await streamAgentChat(
        sessionToken,
        {
          message: trimmed,
          threadId,
          timezone: userTimezone,
        },
        (event) => {
          if (event.type === "progress" && event.message) {
            setProgress(event.message);
          }
          if (event.type === "token" && event.token) {
            setProgress(null);
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                    ...message,
                    content: message.content + event.token,
                  }
                  : message,
              ),
            );
          }

          if (event.type === "provenance" && event.provenance) {
            const prov = event.provenance;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                    ...message,
                    provenances: [...(message.provenances || []), prov],
                  }
                  : message,
              ),
            );
          }

          if (event.type === "telemetry" && event.telemetry) {
            const tel = event.telemetry;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                    ...message,
                    telemetry: tel,
                  }
                  : message,
              ),
            );
          }

          if (event.type === "error") {
            setProgress(null);
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                    ...message,
                    content:
                      message.content ||
                      event.message ||
                      "The assistant encountered an error. Please try again.",
                  }
                  : message,
              ),
            );
          }
        },
        controller.signal,
      );

      refreshThreads();
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: err?.message || "Could not reach the assistant API.",
          },
        ]);
      }
    } finally {
      setRunning(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(prompt);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(prompt);
    }
  }

  const toggleProvExpansion = (msgId: string) => {
    setExpandedProv((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className={styles.root}>
      <aside className={styles.aside}>
        <div className={styles.brandRow}>
          <div className={styles.brandLeft}>
            <div className={styles.brandIcon}>
              <Video className={styles.brandIconSvg} />
            </div>
            <div className={styles.brandText}>
              <p className={styles.brandTitle}>agentic meet</p>
              <p className={styles.brandSubtitle}>Verified Assistant</p>
            </div>
          </div>
        </div>

        <div className={styles.topActions}>
          <Button
            onClick={startNewChat}
            variant="outline"
            className={styles.newChatBtn}
          >
            <MessageSquarePlus className={styles.newChatIcon} />
            New Chat
          </Button>
          {connections}
        </div>
        <Separator className={styles.separator} />
        <div className={styles.chatsSection}>
          <p className={styles.chatsTitle}>Chats</p>
          <ScrollArea className={styles.chatsScroll}>
            {threads.length === 0 ? (
              <p className={styles.chatsEmpty}>
                No conversations yet. Ask a question to begin.
              </p>
            ) : (
              <div className={styles.threadList}>
                {threads.map((thread) => {
                  const active = thread.id === threadId;
                  const isDeleting = deletingThreadId === thread.id;

                  return (
                    <div
                      key={thread.id}
                      className={cn(
                        "group relative flex items-center justify-between rounded-xl transition-all border",
                        active
                          ? "border-[rgb(var(--lp-green))]/35 bg-[rgb(var(--lp-green))]/[0.08] text-white shadow-xs"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.04] text-[var(--lp-mute)] hover:text-white",
                      )}
                    >
                      <button
                        type="button"
                        disabled={running || loadingThread || isDeleting}
                        onClick={() => resumeThread(thread.id)}
                        className="flex min-w-0 flex-1 flex-col px-3 py-2.5 text-left disabled:opacity-50"
                      >
                        <span className={styles.threadTitle}>
                          {thread.title}
                        </span>
                        <span className={styles.threadTime}>
                          {new Date(thread.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </button>

                      <button
                        type="button"
                        title="Delete chat"
                        aria-label="Delete chat"
                        disabled={isDeleting || running}
                        onClick={(e) => handleDeleteThread(thread.id, e)}
                        className={cn(
                          "mr-2 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all",
                          "hover:bg-destructive/15 hover:text-destructive",
                          "opacity-0 group-hover:opacity-100 focus:opacity-100",
                          isDeleting && "opacity-100 cursor-not-allowed",
                        )}
                      >
                        {isDeleting ? (
                          <LoaderCircle className="size-3.5 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
        <Separator className={styles.separator} />

        <div className={styles.footer}>{footer}</div>
      </aside >

    <section className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <p className={styles.headerTitle}>Google Calendar Assistant</p>
            <p className={styles.headerSubtitle}>
              Verified AI Scheduling & Meet Integration
            </p>
          </div>
        </div>
        <div className={styles.timezonePill}>
          <Clock className="size-3.5 text-primary" />
          <span>{userTimezone}</span>
        </div>
      </header>

      <div className={styles.chatColumn}>
        <ScrollArea className={styles.messagesScroll}>
          <div className={styles.messagesInner}>
            {showEmpty ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Sparkles className={styles.emptyIconSvg} />
                </div>
                <h2 className={styles.emptyTitle}>Meeting Assistant</h2>
                <p className={styles.emptyCopy}>{WELCOME}</p>
                <div className={styles.suggestions}>
                  {SUGGESTIONS.map((currentSuggestionItem) => (
                    <Button
                      key={currentSuggestionItem}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(currentSuggestionItem)}
                      className={styles.suggestionBtn}
                      disabled={running || loadingThread}
                    >
                      {currentSuggestionItem}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messageList}>
                {loadingThread ? (
                  <div className={styles.statusRow}>
                    <LoaderCircle className={styles.statusIconSm} />
                    Loading chat...
                  </div>
                ) : (
                  messages.map((message) => {
                    if (message.id === "welcome" && messages.length > 1) {
                      return null;
                    }

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          styles.messageRow,
                          message.role === "user"
                            ? styles.messageRowUser
                            : styles.messageRowAssistant,
                        )}
                      >
                        <div
                          className={cn(
                            styles.bubble,
                            message.role === "user" && styles.bubbleUser,
                            message.role === "assistant" &&
                            styles.bubbleAssistant,
                            message.role === "system" && styles.bubbleSystem,
                          )}
                        >
                          {!message.content && running ? (
                            <span className={styles.thinking}>
                              <LoaderCircle className={styles.statusIconSm} />
                              Thinking...
                            </span>
                          ) : message.role === "user" ? (
                            <p className={styles.userText}>
                              {message.content}
                            </p>
                          ) : (
                            <MarkdownMessage
                              content={message.content}
                              tone={
                                message.role === "system"
                                  ? "system"
                                  : "assistant"
                              }
                            />
                          )}
                        </div>

                        {/* Source Provenance & Observability Badges */}
                        {message.role === "assistant" &&
                          ((message.provenances && message.provenances.length > 0) ||
                            message.telemetry) && (
                              <div className={styles.provenanceWrap}>
                                {message.provenances?.map((prov, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => toggleProvExpansion(message.id)}
                                    className={cn(
                                      prov.sourceType === "calendar_api"
                                        ? styles.provenanceBadge
                                        : styles.provenanceCalculatedBadge,
                                      "cursor-pointer hover:opacity-80 transition-opacity",
                                    )}
                                  >
                                    <ShieldCheck className="size-3" />
                                    <span>
                                      {prov.verificationStatus === "verified_calendar_fact"
                                        ? "Verified via Calendar API"
                                        : "Calculated Availability"}
                                    </span>
                                    {expandedProv[message.id] ? (
                                      <ChevronUp className="size-3" />
                                    ) : (
                                      <ChevronDown className="size-3" />
                                    )}
                                  </button>
                                ))}

                                {message.telemetry && (
                                  <span className={styles.telemetryBadge}>
                                    <Zap className="size-3 text-amber-500" />
                                    <span>
                                      {message.telemetry.totalDurationMs
                                        ? `${message.telemetry.totalDurationMs}ms`
                                        : "streaming"}
                                      {message.telemetry.estimatedCostUsd !== undefined
                                        ? ` • ~$${message.telemetry.estimatedCostUsd.toFixed(4)}`
                                        : ""}
                                    </span>
                                  </span>
                                )}

                                {expandedProv[message.id] && message.provenances && (
                                  <div className="w-full mt-2 rounded-xl border hairline bg-black/60 p-3 text-xs text-[var(--lp-mute)] font-mono space-y-2">
                                    {message.provenances.map((prov, idx) => (
                                      <div key={idx} className="border-b hairline pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-1.5 font-medium text-white">
                                          <CheckCircle2 className="size-3 text-[rgb(var(--lp-green))]" />
                                          <span>Evidence: {prov.toolName || "Calendar"}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-[var(--lp-mute)]">
                                          {prov.evidenceSummary}
                                        </p>
                                        {prov.eventId && (
                                          <p className="mt-0.5 text-[10px] text-[var(--lp-mute)]/70">
                                            Event ID: {prov.eventId}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })
                  )}

                  {progress ? (
                    <div className={styles.statusRow}>
                      <LoaderCircle className={styles.statusIconSm} />
                      {progress}
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          <div className={styles.composerWrap}>
            <form onSubmit={onSubmit} className={styles.composerForm}>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={1}
                onKeyDown={onKeyDown}
                disabled={running}
                placeholder="Ask about your calendar, find free slots, or schedule a Meet..."
                className={styles.composerInput}
              />
              {running ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleStopGenerating}
                  className={styles.stopBtn}
                  aria-label="Stop Generating"
                  title="Stop Generating"
                >
                  <X className={styles.sendIcon} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!prompt.trim() || running}
                  className={styles.sendBtn}
                  aria-label="Send Message"
                >
                  <ArrowUp className={styles.sendIcon} />
                </Button>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
          );
}

          export default ChatPanel;
