"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/lib/validations/auth";
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

// Shared label style: mono eyebrow
const labelClass = "font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

export function RequestResetForm() {
  // Always show the same confirmation regardless of whether the email exists
  // (account enumeration prevention).
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    const supabase = createClient();

    // Errors are intentionally ignored — same response either way (no enumeration).
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/update-password`,
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-100">
          <Mail className="h-6 w-6 text-brand-green-600" />
        </div>
        <div className="space-y-2">
          <h1
            className="font-heading text-3xl text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Check your email
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If an account exists for that address, we&apos;ve sent a password
            reset link. Check your inbox and follow the instructions.
          </p>
        </div>
        <Link
          href="/login"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-600 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-1 motion-reduce:transition-none" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <p className={labelClass}>{"// Account recovery"}</p>
        <h1
          className="font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
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
                Sending…
              </>
            ) : (
              <>
                Send reset link
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
