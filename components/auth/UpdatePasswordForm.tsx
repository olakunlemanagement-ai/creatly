"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";

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
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="group mt-1 inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                >
                  Request a new reset link
                  <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none" />
                </Link>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="terracotta"
            size="cta"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-full"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Set new password
                <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className="group flex items-center justify-center gap-1.5 text-sm font-medium text-terracotta-600 underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-1 motion-reduce:transition-none" />
        Back to sign in
      </Link>
    </div>
  );
}
