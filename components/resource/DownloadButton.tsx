"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import type { ApiResponse } from "@/types/api";

export type EntitlementState = "guest" | "free" | "subscriber";

interface DownloadButtonProps {
  entitlement: EntitlementState;
  resourceId: string;
  resourceSlug: string;
}

type ButtonState = "idle" | "loading" | "no_sub" | "error";

export function DownloadButton({ entitlement, resourceId, resourceSlug }: DownloadButtonProps) {
  const [buttonState, setButtonState] = useState<ButtonState>("idle");

  if (entitlement === "subscriber") {
    const handleDownload = async () => {
      setButtonState("loading");
      try {
        const res = await fetch(`/api/downloads/${resourceId}`, { method: "POST" });

        if (res.status === 401) {
          window.location.href = `/login?next=/resources/${resourceSlug}`;
          return;
        }

        if (res.status === 403) {
          setButtonState("no_sub");
          return;
        }

        if (!res.ok) {
          setButtonState("error");
          return;
        }

        const json = (await res.json()) as ApiResponse<{ url: string; fileName: string }>;
        if (!json.ok) {
          setButtonState("error");
          return;
        }

        // Trigger the browser download without navigating away
        const anchor = document.createElement("a");
        anchor.href = json.data.url;
        anchor.download = json.data.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setButtonState("idle");
      } catch {
        setButtonState("error");
      }
    };

    return (
      <div className="flex flex-col gap-1.5">
        <Button
          size="lg"
          className="w-full gap-2 bg-brand-green-600 text-white hover:bg-brand-green-700"
          onClick={handleDownload}
          disabled={buttonState === "loading"}
        >
          {buttonState === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {buttonState === "loading" ? "Downloading…" : "Download"}
        </Button>

        {buttonState === "no_sub" && (
          <p className="text-center text-xs text-muted-foreground">
            Your subscription is no longer active.{" "}
            <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">
              Renew your plan
            </Link>{" "}
            to continue downloading.
          </p>
        )}

        {buttonState === "error" && (
          <p className="text-center text-xs text-destructive">
            Download failed. Please try again.
          </p>
        )}
      </div>
    );
  }

  if (entitlement === "free") {
    return (
      <div className="flex flex-col gap-1.5">
        <Button
          size="lg"
          className="w-full gap-2 bg-brand-green-600 text-white hover:bg-brand-green-700"
          asChild
        >
          <Link href="/pricing">
            <Download className="size-4" />
            Download
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Included with a{" "}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">
            {APP_NAME} subscription
          </Link>
          .
        </p>
      </div>
    );
  }

  // guest
  return (
    <div className="flex flex-col gap-1.5">
      <Button
        size="lg"
        className="w-full gap-2 bg-brand-green-600 text-white hover:bg-brand-green-700"
        asChild
      >
        <Link href={`/signup?next=/resources/${resourceSlug}`}>
          <Download className="size-4" />
          Download
        </Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">Sign up to get started.</p>
    </div>
  );
}
