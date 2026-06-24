"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/config";
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
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

// Shared label style: mono eyebrow
const labelClass = "font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const isCreatorFlow = next === "/creators/apply";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

    const confirmNext = isCreatorFlow ? "/creators/apply" : "/browse";
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name ?? "" },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${confirmNext}`,
      },
    });

    // Treat "User already registered" the same as success — no enumeration.
    if (error && error.message !== "User already registered") {
      setServerError("Something went wrong. Please try again.");
      return;
    }

    // When email confirmation is disabled Supabase returns a session immediately.
    if (data.session) {
      // Creator flow: skip onboarding wizard, go straight to creator profile setup.
      router.push(isCreatorFlow ? "/creators/apply" : "/onboarding");
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
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
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
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
              </>
            )}
          </Button>
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
