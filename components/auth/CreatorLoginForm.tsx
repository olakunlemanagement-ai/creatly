"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
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

const labelClass = "font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

type LoginError =
  | { type: "unverified"; email: string }
  | { type: "generic"; message: string }
  | null;

export function CreatorLoginForm() {
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (!error && data.user) {
      // After login, redirect to creator studio
      router.push("/creator");
      router.refresh();
      return;
    }

    if (error?.message === "Email not confirmed") {
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
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/creator`,
      },
    });
    setResendSent(true);
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <p className={labelClass}>{"// Creator access"}</p>
        <h1
          className="font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome back, creator.
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your uploads and track your earnings.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
                  <Input type="password" autoComplete="current-password" {...field} />
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
                <p className="mt-1 text-amber-700">Verification email sent — check your inbox.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => resendVerification(loginError.email)}
                  className="group mt-1 inline-flex items-center gap-1 font-medium text-terracotta-600 underline-offset-4 hover:underline"
                >
                  Resend verification email
                  <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none" />
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
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Footer links */}
      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have a creator account?{" "}
          <Link
            href="/creator/signup"
            className="font-medium text-terracotta-600 underline-offset-4 hover:underline"
          >
            Apply to join
          </Link>
        </p>
        <p>
          Looking for your buyer account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-green-700 underline-offset-4 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
