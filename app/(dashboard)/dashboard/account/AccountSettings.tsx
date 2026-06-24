"use client";

import { useActionState, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { changePassword, changeEmail, deleteAccount } from "@/lib/actions/account";
import type { AccountActionState } from "@/lib/actions/account";

const init: AccountActionState | null = null;

interface Props {
  currentEmail: string;
}

export function AccountSettings({ currentEmail }: Props) {
  const [pwState, pwAction, pwPending]       = useActionState(changePassword, init);
  const [emailState, emailAction, emailPending] = useActionState(changeEmail, init);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccount, init);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  return (
    <div className="space-y-10">
      {/* Change password */}
      <section>
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Change password
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          You will need to sign in again after changing your password.
        </p>
        <form action={pwAction} className="space-y-4 sm:max-w-sm">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              NEW PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {pwState?.ok === false && (
            <p className="text-sm text-destructive">{pwState.error}</p>
          )}
          {pwState?.ok === true && (
            <p className="text-sm text-brand-green-600">{pwState.message}</p>
          )}

          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
          >
            {pwPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </section>

      <hr className="border-border" />

      {/* Change email */}
      <section>
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Email address
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Current: <span className="font-medium text-foreground">{currentEmail}</span>
        </p>
        <form action={emailAction} className="space-y-4 sm:max-w-sm">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              NEW EMAIL ADDRESS
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {emailState?.ok === false && (
            <p className="text-sm text-destructive">{emailState.error}</p>
          )}
          {emailState?.ok === true && (
            <p className="text-sm text-brand-green-600">{emailState.message}</p>
          )}

          <button
            type="submit"
            disabled={emailPending}
            className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
          >
            {emailPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Change email
          </button>
        </form>
      </section>

      <hr className="border-border" />

      {/* Connected accounts placeholder */}
      <section>
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Connected accounts
        </h2>
        <p className="text-sm text-muted-foreground">
          Social login (Google, etc.) — coming soon.
        </p>
      </section>

      <hr className="border-border" />

      {/* Danger zone */}
      <section>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-heading text-base font-semibold text-destructive">
                Delete account
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-4 rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                Delete my account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Delete your account?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete your account, profile, downloads history, and favourites.
              Your subscription will also be cancelled. This cannot be undone.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <form
              action={deleteAction}
              onSubmit={() => { if (deleteText !== "DELETE") { return; } }}
            >
              <input
                name="confirm"
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                autoFocus
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
              />

              {deleteState?.ok === false && (
                <p className="mt-2 text-sm text-destructive">{deleteState.error}</p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteText(""); }}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteText !== "DELETE" || deletePending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletePending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete account
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
