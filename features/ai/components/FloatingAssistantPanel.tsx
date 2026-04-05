"use client";

import {
  Bot,
  Eraser,
  FileText,
  LoaderCircle,
  MessageSquare,
  Printer,
  Send,
  User,
  X,
} from "lucide-react";
import { Suspense } from "react";
import { useEffect, useState } from "react";

import { useAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { captureElementAsDataUrl } from "@/features/ai/utils/dashboardScreenshot";
import { usePathname } from "@/lib/hooks/navigationHooks";

type FloatingAssistantPanelProps = {
  sectionTitle: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type ReportType = "quick-summary" | "full-pdf";

const MAX_MESSAGE_LENGTH = 1_000;

const quickQuestions = [
  "Summarize this view",
  "What needs attention first?",
  "What should I do next?",
];

export function FloatingAssistantPanel({ sectionTitle }: FloatingAssistantPanelProps) {
  return (
    <Suspense fallback={null}>
      <FloatingAssistantPanelContent sectionTitle={sectionTitle} />
    </Suspense>
  );
}

function FloatingAssistantPanelContent({ sectionTitle }: FloatingAssistantPanelProps) {
  const pathname = usePathname();
  const visibleContext = useAIVisibleContext();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const trimmedInput = input.trim();
  const canSend =
    !isLoading &&
    trimmedInput.length > 0 &&
    trimmedInput.length <= MAX_MESSAGE_LENGTH;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    setIsOpen(false);
    setInput("");
    setIsLoading(false);
    setMessages([]);
  }, [pathname]);

  const clearChat = () => {
    setInput("");
    setIsLoading(false);
    setMessages([]);
  };

  const handleSend = async (messageOverride?: string) => {
    const outboundMessage = (messageOverride ?? trimmedInput).trim();

    if (
      isLoading ||
      !outboundMessage ||
      outboundMessage.length > MAX_MESSAGE_LENGTH
    ) {
      return;
    }

    pushMessage("user", outboundMessage);
    setInput("");

    try {
      setIsLoading(true);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: outboundMessage,
          visibleContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate response.");
      }

      pushMessage("assistant", data.reply ?? "No response generated.");
    } catch (error) {
      pushMessage(
        "assistant",
        error instanceof Error ? error.message : "Failed to generate response.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async ({
    prompt,
    reportType,
    includeScreenshot,
    exportPdf,
  }: {
    prompt: string;
    reportType: ReportType;
    includeScreenshot: boolean;
    exportPdf: boolean;
  }) => {
    if (isLoading) {
      return;
    }

    pushMessage("user", prompt);

    try {
      setIsLoading(true);

      const screenshotDataUrl = includeScreenshot
        ? await captureDashboardScreenshot()
        : undefined;

      const response = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          reportType,
          visibleContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate report.");
      }

      const markdown =
        typeof data.markdown === "string" ? data.markdown : "No report generated.";
      pushMessage("assistant", markdown);

      if (exportPdf && typeof data.printableHtml === "string") {
        openPrintableReport(data.printableHtml, screenshotDataUrl);
      }
    } catch (error) {
      pushMessage(
        "assistant",
        error instanceof Error ? error.message : "Failed to generate report.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6">
      {isOpen ? (
        <Card className="pointer-events-auto w-full border-slate-200 bg-white shadow-2xl sm:w-[min(460px,calc(100vw-2rem))] dark:border-slate-700 dark:bg-slate-950">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                  RIOS AI
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  Current view
                </Badge>
              </div>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                {sectionTitle}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="h-8 w-8 rounded-full"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full"
                aria-label="Close AI assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-3 px-4 pb-4 pt-1 sm:px-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSend("Explain this page")}
                  className="h-auto justify-start rounded-2xl px-3 py-2 text-left"
                >
                  <MessageSquare className="h-4 w-4" />
                  Explain this page
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void handleReportAction({
                      prompt: "Generate a quick summary report for this dashboard.",
                      reportType: "quick-summary",
                      includeScreenshot: false,
                      exportPdf: false,
                    })
                  }
                  className="h-auto justify-start rounded-2xl px-3 py-2 text-left"
                >
                  <FileText className="h-4 w-4" />
                  Generate report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void handleReportAction({
                      prompt: "Generate a printable PDF report for the current dashboard view.",
                      reportType: "full-pdf",
                      includeScreenshot: true,
                      exportPdf: true,
                    })
                  }
                  className="h-auto justify-start rounded-2xl px-3 py-2 text-left"
                >
                  <Printer className="h-4 w-4" />
                  Export as PDF
                </Button>
              </div>

              {!hasMessages ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can also type things like &quot;summarize this view&quot;,
                  &quot;generate report&quot;, or &quot;export PDF&quot;.
                </p>
              ) : null}
            </div>
            <Separator />
            <ScrollArea className="max-h-[min(42vh,340px)] px-4 sm:px-5">
              <div className="space-y-4 py-4 sm:py-5">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                    Ask about this dashboard or request a report.
                  </div>
                ) : null}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Bot className="h-4 w-4" />
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[calc(100%-3rem)] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap sm:max-w-[85%] ${
                        message.role === "user"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="mt-2 text-[11px] opacity-70">{message.timestamp}</p>
                    </div>
                    {message.role === "user" ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <User className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex justify-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
            <Separator />
            <div className="space-y-3 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question) => (
                    <Button
                      key={question}
                      type="button"
                      variant="outline"
                      onClick={() => setInput(question)}
                      className="h-auto rounded-full px-3 py-1.5 text-xs sm:text-sm"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleSend();
                    }
                  }}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Ask RIOS AI about this view..."
                  className="rounded-2xl border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <Button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  className="shrink-0 rounded-2xl bg-slate-900 px-4 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="pointer-events-auto h-12 w-full rounded-full bg-slate-900 px-5 text-white shadow-xl hover:bg-slate-800 sm:h-14 sm:w-auto dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <MessageSquare className="h-5 w-5" />
        Ask RIOS AI
      </Button>
    </div>
  );

  function pushMessage(role: ChatMessage["role"], content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + prev.length,
        role,
        content,
        timestamp: formatTimestamp(),
      },
    ]);
  }
}

async function captureDashboardScreenshot() {
  const root = document.querySelector<HTMLElement>("[data-dashboard-capture-root='true']");

  if (!root) {
    throw new Error("Could not find the current dashboard view to capture.");
  }

  return captureElementAsDataUrl(root);
}

function openPrintableReport(html: string, screenshotDataUrl?: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;

  if (!iframeWindow) {
    iframe.remove();
    throw new Error("The printable report frame could not be created.");
  }

  const printableHtml = screenshotDataUrl
    ? injectScreenshotIntoPrintableHtml(html, screenshotDataUrl)
    : html;

  iframe.onload = () => {
    iframeWindow.focus();
    iframeWindow.print();
    window.setTimeout(() => iframe.remove(), 1000);
  };

  iframeWindow.document.open();
  iframeWindow.document.write(printableHtml);
  iframeWindow.document.close();
}

function injectScreenshotIntoPrintableHtml(html: string, screenshotDataUrl: string) {
  const screenshotSection = `
    <section class="card">
      <h2>Dashboard Screenshot</h2>
      <img class="screenshot" src="${screenshotDataUrl}" alt="Dashboard screenshot" />
    </section>
  `;

  return html.replace("</body>", `${screenshotSection}</body>`);
}

function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
