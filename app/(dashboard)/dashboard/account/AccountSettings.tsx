"use client";

import { useActionState, useState, useRef } from "react";
import { Loader2, AlertTriangle, Upload } from "lucide-react";
import { changePassword, changeEmail, deleteAccount } from "@/lib/actions/account";
import { updateAvatar, updateProfileExtended } from "@/lib/actions/profile";
import type { AccountActionState } from "@/lib/actions/account";
import type { UpdateProfileState } from "@/lib/actions/profile";

const init: AccountActionState | null = null;
const profileInit: UpdateProfileState | null = null;

const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";
const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-sm";

interface Props {
  currentEmail: string;
  fullName: string | null;
  avatarPath: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
}

export function AccountSettings({
  currentEmail,
  fullName,
  avatarPath,
  gender,
  dateOfBirth,
  phoneNumber,
}: Props) {
  const [pwState, pwAction, pwPending]             = useActionState(changePassword, init);
  const [emailState, emailAction, emailPending]    = useActionState(changeEmail, init);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccount, init);
  const [extState, extAction, extPending]          = useActionState(updateProfileExtended, profileInit);
  const [avatarState, avatarAction, avatarPending] = useActionState(updateAvatar, profileInit);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarPath);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  const initials = (fullName ?? currentEmail)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const nameParts = (fullName ?? "").trim().split(/\s+/);
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ");

  return (
    <div className="space-y-10">

      {/* ── Photo Profile ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Photo Profile
        </h2>
        <div className="flex items-start gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-green-700/20">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Profile photo" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand-green-700">
                {initials}
              </span>
            )}
          </div>
          <form action={avatarAction} className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              Choose image
            </button>
            {avatarPreview !== avatarPath && (
              <button
                type="submit"
                disabled={avatarPending}
                className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-medium text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
              >
                {avatarPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save photo
              </button>
            )}
            {avatarState?.ok === false && <p className="text-xs text-destructive">{avatarState.error}</p>}
            {avatarState?.ok === true && <p className="text-xs text-brand-green-600">Photo updated!</p>}
            <p className="text-[11px] text-muted-foreground">JPEG, PNG, WebP or GIF · Max 2 MB</p>
          </form>
        </div>
      </section>

      <hr className="border-border" />

      {/* ── Personal Information + Contact + General (one form) ── */}
      <form action={extAction} className="space-y-10">

        {/* Personal Information */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 sm:max-w-sm">
              <div>
                <label htmlFor="ac_first_name" className={labelClass}>FIRST NAME</label>
                <input
                  id="ac_first_name"
                  name="first_name"
                  type="text"
                  defaultValue={defaultFirstName}
                  placeholder="Ada"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="ac_last_name" className={labelClass}>LAST NAME</label>
                <input
                  id="ac_last_name"
                  name="last_name"
                  type="text"
                  defaultValue={defaultLastName}
                  placeholder="Okafor"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ac_gender" className={labelClass}>GENDER</label>
              <select id="ac_gender" name="gender" defaultValue={gender ?? ""} className={inputClass}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="ac_dob" className={labelClass}>DATE OF BIRTH</label>
              <input
                id="ac_dob"
                name="date_of_birth"
                type="date"
                defaultValue={dateOfBirth ?? ""}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Contact Information
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="ac_phone" className={labelClass}>PHONE NUMBER</label>
              <input
                id="ac_phone"
                name="phone_number"
                type="tel"
                defaultValue={phoneNumber ?? ""}
                placeholder="+234 800 000 0000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>EMAIL ADDRESS</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 sm:max-w-sm">
                <span className="text-sm text-foreground">{currentEmail}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">Read-only</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use &ldquo;Change email&rdquo; below to update your email address.
              </p>
            </div>
          </div>
        </section>

        {/* General */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </h2>
          <div>
            <label htmlFor="ac_language" className={labelClass}>LANGUAGE</label>
            <select id="ac_language" name="language" defaultValue="en" className={inputClass}>
              <option value="en">English</option>
              <option value="yo">Yoruba</option>
              <option value="ig">Igbo</option>
              <option value="ha">Hausa</option>
              <option value="fr">French</option>
            </select>
          </div>
        </section>

        {extState?.ok === false && (
          <p className="text-sm text-destructive">{extState.error}</p>
        )}
        {extState?.ok === true && (
          <p className="text-sm text-brand-green-600">Profile saved!</p>
        )}

        <button
          type="submit"
          disabled={extPending}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
        >
          {extPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </form>

      <hr className="border-border" />

      {/* ── Security ── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Security
        </h2>

        {/* Change password */}
        <div className="mt-4">
          <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
            Change password
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            You will need to sign in again after changing your password.
          </p>
          <form action={pwAction} className="space-y-4 sm:max-w-sm">
            <div>
              <label htmlFor="password" className={labelClass}>NEW PASSWORD</label>
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
              <label htmlFor="confirm" className={labelClass}>CONFIRM PASSWORD</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {pwState?.ok === false && <p className="text-sm text-destructive">{pwState.error}</p>}
            {pwState?.ok === true && <p className="text-sm text-brand-green-600">{pwState.message}</p>}
            <button
              type="submit"
              disabled={pwPending}
              className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
            >
              {pwPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        </div>

        {/* Change email */}
        <div className="mt-8">
          <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
            Change email address
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentEmail}</span>
          </p>
          <form action={emailAction} className="space-y-4 sm:max-w-sm">
            <div>
              <label htmlFor="email" className={labelClass}>NEW EMAIL ADDRESS</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {emailState?.ok === false && <p className="text-sm text-destructive">{emailState.error}</p>}
            {emailState?.ok === true && <p className="text-sm text-brand-green-600">{emailState.message}</p>}
            <button
              type="submit"
              disabled={emailPending}
              className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
            >
              {emailPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Change email
            </button>
          </form>
        </div>
      </section>

      <hr className="border-border" />

      {/* ── Danger Zone ── */}
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
              This will permanently delete your account, profile, download history, and starred items.
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
