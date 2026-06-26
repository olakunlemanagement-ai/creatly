"use client";

import { useTransition, useRef, useState } from "react";
import { Loader2, Send, CheckIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { inviteAdmin } from "@/lib/actions/admin";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = {
  id: string;
  name: string;
  label: string;
  description: string | null;
};

interface Props {
  roles: Role[];
}

export function InviteAdminForm({ roles }: Props) {
  const [isPending, startTransition] = useTransition();
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (new FormData(e.currentTarget).get("email") as string | null)?.trim() ?? "";
    if (!email || !roleId) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await inviteAdmin(email, roleId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
        setRoleId("");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-1 text-sm font-semibold text-foreground">Invite team member</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        An email will be sent with a link to accept the invite. The link expires in 7 days.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="email@example.com"
            disabled={isPending}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Role</label>
          <Select value={roleId} onValueChange={setRoleId} disabled={isPending}>
            <SelectTrigger className="h-auto min-w-44 rounded-xl border-border px-3 py-2.5 text-sm">
              <SelectValue placeholder="Select role…" />
            </SelectTrigger>
            <SelectContent className="min-w-64">
              {roles.map((r) => (
                <SelectPrimitive.Item
                  key={r.id}
                  value={r.id}
                  className="relative flex w-full cursor-default flex-col rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <span className="pointer-events-none absolute right-2 top-2.5 flex size-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <CheckIcon className="h-3 w-3" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{r.label}</SelectPrimitive.ItemText>
                  {r.description && (
                    <span className="mt-0.5 text-xs text-muted-foreground">{r.description}</span>
                  )}
                </SelectPrimitive.Item>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="submit"
          disabled={isPending || !roleId}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send invite
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-xs text-green-600">Invite sent successfully.</p>
      )}
    </div>
  );
}
