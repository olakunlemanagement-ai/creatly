"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { verifyBankAccountSchema } from "@/lib/validations/bank-account";
import { verifyBankAccount, saveBankAccount } from "@/lib/actions/bank-account";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

type FormValues = z.infer<typeof verifyBankAccountSchema>;

type Bank = { code: string; name: string };

type Step =
  | { type: "form" }
  | { type: "confirm"; account_name: string; bank_name: string };

type Props = {
  banks: Bank[];
  onSaved?: () => void;
};

export default function BankAccountForm({ banks, onSaved }: Props) {
  const [step, setStep] = useState<Step>({ type: "form" });
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(verifyBankAccountSchema),
    defaultValues: { bank_code: "", account_number: "" },
  });

  function handleVerify(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await verifyBankAccount(values);
      if (!result.ok) {
        setServerError(result.error);
        if (result.field) {
          form.setError(result.field as keyof FormValues, { message: result.error });
        }
        return;
      }
      const bankName = banks.find((b) => b.code === values.bank_code)?.name ?? "";
      setStep({ type: "confirm", account_name: result.data!.account_name, bank_name: bankName });
    });
  }

  function handleSave() {
    if (step.type !== "confirm") return;
    setServerError(null);
    const values = form.getValues();
    startTransition(async () => {
      const result = await saveBankAccount({
        bank_code: values.bank_code,
        account_number: values.account_number,
        account_name: step.account_name,
        bank_name: step.bank_name,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSaveSuccess(true);
      onSaved?.();
    });
  }

  if (saveSuccess) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-700">Bank account saved successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step.type === "form" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-5">
            <FormField
              control={form.control}
              name="bank_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="0123456789"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="\d{10}"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Verifying…" : "Verify account"}
            </Button>
          </form>
        </Form>
      )}

      {step.type === "confirm" && (
        <div className="space-y-5">
          <div className="rounded-lg border bg-muted/40 p-5 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {"// CONFIRM ACCOUNT"}
            </p>
            <div>
              <p className="text-xs text-muted-foreground">Account name</p>
              <p className="text-base font-semibold text-foreground">{step.account_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bank</p>
              <p className="text-base font-medium text-foreground">{step.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account number</p>
              <p className="text-base font-medium text-foreground">
                {form.getValues("account_number")}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Is this correct? Payouts will be sent to this account.
          </p>

          {serverError && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep({ type: "form" })}
              disabled={isPending}
            >
              Change details
            </Button>
            <Button onClick={handleSave} disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : "Yes, save this account"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
