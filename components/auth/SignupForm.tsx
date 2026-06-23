"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/config";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

// Shared label style: mono eyebrow
const labelClass = "font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // Always show "check email" state after submit — no enumeration of existing emails.
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const passwordValue = form.watch("password");

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    const supabase = createClient();

    // emailRedirectTo points at the confirm route which exchanges the token
    // and redirects to /browse after verification.
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name ?? "" },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/browse`,
      },
    });

    // Treat "User already registered" the same as success — no enumeration.
    if (error && error.message !== "User already registered") {
      setServerError("Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-100">
          <CheckCircle2 className="h-6 w-6 text-brand-green-600" />
        </div>
        <div className="space-y-2">
          <h1
            className="font-heading text-3xl text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Check your email
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;ve sent a verification link to your inbox. Click it to
            activate your {APP_NAME} account.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Wrong email?{" "}
          <button
            onClick={() => setSubmitted(false)}
            className="font-medium text-terracotta-600 underline-offset-4 hover:underline"
          >
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <p className={labelClass}>{"// Create account"}</p>
        <h1
          className="font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Join {APP_NAME}
        </h1>
        <p className="text-sm text-muted-foreground">
          Unlimited creative resources, made for African creators.
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
            name="full_name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className={labelClass}>Full name (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ada Okafor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className={labelClass}>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ada@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className={labelClass}>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
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
                <FormLabel className={labelClass}>Confirm password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
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
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-full rounded-lg bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
          >
            {form.formState.isSubmitting ? "Creating account…" : "Create account →"}
          </button>
        </form>
      </Form>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-terracotta-600 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
