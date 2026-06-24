"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size={iconOnly ? "icon" : "sm"}
        className={iconOnly ? `h-7 w-7 text-muted-foreground hover:text-foreground ${className ?? ""}` : className}
        aria-label="Sign out"
      >
        {iconOnly ? <LogOut className="h-3.5 w-3.5" /> : "Sign out"}
      </Button>
    </form>
  );
}
