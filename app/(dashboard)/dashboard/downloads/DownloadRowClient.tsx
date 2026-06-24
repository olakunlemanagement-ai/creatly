"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

interface Props {
  resourceId: string;
  fileName: string;
}

export function ReDownloadButton({ resourceId, fileName }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "error" | "denied">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch(`/api/downloads/${resourceId}`, { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        setState("denied");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      const { url, fileName: dlFileName } = (await res.json()) as { url: string; fileName: string };
      const a = document.createElement("a");
      a.href = url;
      a.download = dlFileName ?? fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (state === "denied") {
    return (
      <a
        href="/pricing"
        className="whitespace-nowrap text-xs font-medium text-terracotta-500 hover:text-terracotta-600"
      >
        Subscribe to download
      </a>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={() => setState("idle")}
        className="whitespace-nowrap text-xs text-muted-foreground hover:text-foreground"
      >
        Failed — retry
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
    >
      {state === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      Re-download
    </button>
  );
}
