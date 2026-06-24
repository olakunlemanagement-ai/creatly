"use client";

import { useActionState, useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { updateProfile, updateAvatar } from "@/lib/actions/profile";
import type { UpdateProfileState } from "@/lib/actions/profile";

const initialState: UpdateProfileState | null = null;

interface Props {
  fullName: string | null;
  email: string;
  avatarPath: string | null;
  memberSince: string;
}

export function ProfileForm({ fullName, email, avatarPath, memberSince }: Props) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState);
  const [avatarState, avatarAction, avatarPending] = useActionState(updateAvatar, initialState);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarPath);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (fullName ?? email)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  return (
    <div className="space-y-8">
      {/* Avatar section */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Avatar
        </h2>
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-green-700/20">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
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
                className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-medium text-cream-100 transition-colors hover:bg-brand-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {avatarPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save avatar
              </button>
            )}

            {avatarState?.ok === false && (
              <p className="text-xs text-destructive">{avatarState.error}</p>
            )}
            {avatarState?.ok === true && (
              <p className="text-xs text-brand-green-600">Avatar updated!</p>
            )}

            <p className="text-[11px] text-muted-foreground">
              JPEG, PNG, WebP or GIF · Max 2 MB
            </p>
          </form>
        </div>
      </section>

      {/* Profile details */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Profile details
        </h2>
        <form action={profileAction} className="space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-xs font-semibold text-muted-foreground"
            >
              DISPLAY NAME
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={fullName ?? ""}
              placeholder="Your name"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              EMAIL ADDRESS
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 sm:max-w-sm">
              <span className="text-sm text-foreground">{email}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">Read-only</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              To change your email, go to{" "}
              <a href="/dashboard/account" className="underline">
                Account settings
              </a>
              .
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              MEMBER SINCE
            </label>
            <p className="text-sm text-muted-foreground">{memberSince}</p>
          </div>

          {profileState?.ok === false && (
            <p className="text-sm text-destructive">{profileState.error}</p>
          )}
          {profileState?.ok === true && (
            <p className="text-sm text-brand-green-600">Profile saved!</p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {profilePending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}
