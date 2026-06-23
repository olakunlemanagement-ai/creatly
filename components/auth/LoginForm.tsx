"use client";

import { useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

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

type LoginError =
  | { type: "unverified"; email: string }
  | { type: "generic"; message: string }
  | null;

function safeNext(raw: string | undefined): string {
  if (!raw) return "/browse";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/browse";
}

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const router = useRouter();
  const [loginError, setLoginError] = useState<LoginError>(null);
  const [resendSent, setResendSent] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoginError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (!error) {
      router.push(safeNext(next));
      router.refresh();
      return;
    }

    if (error.message === "Email not confirmed") {
      setLoginError({ type: "unverified", email: values.email });
      return;
    }

    setLoginError({ type: "generic", message: "Invalid email or password." });
  }

  async function resendVerification(email: string) {
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/browse`,
      },
    });
    setResendSent(true);
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <p className={labelClass}>{"// Welcome back"}</p>
        <h1
          className="font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to continue.
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
                <div className="flex items-center justify-between">
                  <FormLabel className={labelClass}>Password</FormLabel>
                  <Link
                    href="/reset-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unverified email error */}
          {loginError?.type === "unverified" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <p className="font-medium text-amber-800">
                Please verify your email before signing in.
              </p>
              {resendSent ? (
                <p className="mt-1 text-amber-700">
                  Verification email sent — check your inbox.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => resendVerification(loginError.email)}
                  className="mt-1 font-medium text-terracotta-600 underline-offset-4 hover:underline"
                >
                  Resend verification email →
                </button>
              )}
            </div>
          )}

          {/* Generic error */}
          {loginError?.type === "generic" && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loginError.message}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-full rounded-lg bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
          >
            {form.formState.isSubmitting ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </Form>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-terracotta-600 underline-offset-4 hover:underline"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
