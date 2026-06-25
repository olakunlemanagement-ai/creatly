"use client";

import { useActionState, useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { updateAvatar, updateProfileExtended } from "@/lib/actions/profile";
import type { UpdateProfileState } from "@/lib/actions/profile";

const initialState: UpdateProfileState | null = null;

interface Props {
  fullName: string | null;
  email: string;
  avatarPath: string | null;
  memberSince: string;
  gender: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
}

const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";
const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-sm";

export function ProfileForm({
  fullName,
  email,
  avatarPath,
  memberSince,
  gender,
  dateOfBirth,
  phoneNumber,
}: Props) {
  const [extState, extAction, extPending] = useActionState(updateProfileExtended, initialState);
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

  // Split full name into first / last for the form display
  const nameParts = (fullName ?? "").trim().split(/\s+/);
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ");

  return (
    <div className="space-y-10">

      {/* ── Avatar ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Photo Profile
        </h2>
        <div className="flex items-start gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-green-700/20">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
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
                Save photo
              </button>
            )}

            {avatarState?.ok === false && (
              <p className="text-xs text-destructive">{avatarState.error}</p>
            )}
            {avatarState?.ok === true && (
              <p className="text-xs text-brand-green-600">Photo updated!</p>
            )}
            <p className="text-[11px] text-muted-foreground">JPEG, PNG, WebP or GIF · Max 2 MB</p>
          </form>
        </div>
      </section>

      {/* ── Personal information + Contact + General (one form) ── */}
      <form action={extAction} className="space-y-10">

        {/* Personal Information */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 sm:max-w-sm">
              <div>
                <label htmlFor="first_name" className={labelClass}>FIRST NAME</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  defaultValue={defaultFirstName}
                  placeholder="Ada"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="last_name" className={labelClass}>LAST NAME</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  defaultValue={defaultLastName}
                  placeholder="Okafor"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label htmlFor="gender" className={labelClass}>GENDER</label>
              <select
                id="gender"
                name="gender"
                defaultValue={gender ?? ""}
                className={inputClass}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="date_of_birth" className={labelClass}>DATE OF BIRTH</label>
              <input
                id="date_of_birth"
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
              <label htmlFor="phone_number" className={labelClass}>PHONE NUMBER</label>
              <input
                id="phone_number"
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
          </div>
        </section>

        {/* General */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </h2>
          <div>
            <label htmlFor="language" className={labelClass}>LANGUAGE</label>
            <select
              id="language"
              name="language"
              defaultValue={"en"}
              className={inputClass}
            >
              <option value="en">English</option>
              <option value="yo">Yoruba</option>
              <option value="ig">Igbo</option>
              <option value="ha">Hausa</option>
              <option value="fr">French</option>
            </select>
          </div>
        </section>

        {/* Hidden full_name = first + last (joined server-side via action) */}
        {/* We pass first_name + last_name and join them in updateProfileExtended */}

        {extState?.ok === false && (
          <p className="text-sm text-destructive">{extState.error}</p>
        )}
        {extState?.ok === true && (
          <p className="text-sm text-brand-green-600">Profile saved!</p>
        )}

        <button
          type="submit"
          disabled={extPending}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {extPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </form>

      {/* Member since */}
      <section>
        <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
      </section>
    </div>
  );
}
