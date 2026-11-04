"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import Link from "next/link";

const styles = {
  root: "markdown-body min-w-0 max-w-full overflow-hidden text-[14.5px] leading-relaxed text-[#dbe5df] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  rootUser:
  "[&_a]:text-[#07090a] [&_a]:underline text-[#07090a]",
  p: "mb-3 last:mb-0",
  ul: "mb-3 list-disc space-y-1 pl-5 text-[14px] last:mb-0",
  ol: "mb-3 list-decimal space-y-1 pl-5 text-[14px] last:mb-0",
  li: "leading-relaxed",
  strong: "font-semibold text-white",
  em: "italic text-[#e8efea]",
  codeBlock:
  "block overflow-x-auto rounded-lg border hairline bg-black/60 px-3 py-2 text-[12.5px] font-mono leading-6 text-[rgb(var(--lp-green))]",
  codeInline: "rounded-md border hairline bg-white/[0.06] px-1.5 py-0.5 text-[12px] font-mono text-[rgb(var(--lp-green))]",
  pre: "mb-3 max-w-full overflow-x-auto rounded-xl border hairline bg-black/50 p-3 last:mb-0",
  h1: "mb-2 text-lg font-semibold tracking-tight text-white",
  h2: "mb-2 text-base font-semibold tracking-tight text-white",
  h3: "mb-1.5 text-sm font-semibold text-white",
  blockquote: "mb-3 border-l-2 border-[rgb(var(--lp-green))] pl-3 text-[var(--lp-mute)] italic",
} as const;

type Props = {
  content: string;
  className?: string;
  tone?: "assistant" | "user" | "system";
};

export function MarkdownMessage({
  content,
  className,
  tone = "assistant",
}: Props) {
  return (
    <div
      className={cn(styles.root, tone === "user" && styles.rootUser, className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <Link
              href={href ?? "#"}
              className="text-[rgb(var(--lp-green))] underline decoration-[rgb(var(--lp-green))]/40 underline-offset-4 hover:decoration-[rgb(var(--lp-green))] transition-colors"
            >
              {children}
            </Link>
          ),
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          strong: ({ children }) => (
            <strong className={styles.strong}>{children}</strong>
          ),
          em: ({ children }) => <em className={styles.em}>{children}</em>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = Boolean(codeClassName);
            return (
              <code className={isBlock ? styles.codeBlock : styles.codeInline}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
          h1: ({ children }) => <h3 className={styles.h1}>{children}</h3>,
          h2: ({ children }) => <h3 className={styles.h2}>{children}</h3>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
