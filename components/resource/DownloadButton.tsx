"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";

export type EntitlementState = "guest" | "free" | "subscriber";

interface DownloadButtonProps {
  entitlement: EntitlementState;
  resourceSlug: string;
}

export function DownloadButton({ entitlement, resourceSlug }: DownloadButtonProps) {
  const [stubClicked, setStubClicked] = useState(false);

  if (entitlement === "subscriber") {
    return (
      <div className="flex flex-col gap-1.5">
        <Button
          size="lg"
          className="w-full gap-2 bg-brand-green-600 text-white hover:bg-brand-green-700"
          onClick={() => {
            // TODO 1.8: replace with real download via /api/downloads/[resourceId]
            setStubClicked(true);
          }}
        >
          <Download className="size-4" />
          Download
        </Button>
        {stubClicked && (
          <p className="text-center text-xs text-muted-foreground">
            Download mechanic coming in step 1.8.
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
