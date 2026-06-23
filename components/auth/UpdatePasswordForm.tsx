"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Shared label style: mono eyebrow
const labelClass = "font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const passwordValue = form.watch("password");

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      // "Auth session missing" means the recovery token already expired.
      if (error.message.includes("session")) {
        setServerError("Your reset link has expired. Request a new one.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
      return;
    }

    router.push("/login");
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <p className={labelClass}>{"// New password"}</p>
        <h1
          className="font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Set new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className={labelClass}>New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                      suppressHydrationWarning
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <PasswordStrengthMeter value={passwordValue} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className={labelClass}>Confirm new password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                      suppressHydrationWarning
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <p>{serverError}</p>
              {serverError.includes("expired") && (
                <Link
                  href="/reset-password"
                  className="mt-1 block font-medium underline-offset-4 hover:underline"
                >
                  Request a new reset link →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-full rounded-lg bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
          >
            {form.formState.isSubmitting ? "Saving…" : "Set new password →"}
          </button>
        </form>
      </Form>
    </div>
  );
}
