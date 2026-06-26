import { z } from "zod";

export const verifyBankAccountSchema = z.object({
  bank_code: z.string().min(1, "Please select a bank."),
  account_number: z
    .string()
    .length(10, "Account number must be exactly 10 digits.")
    .regex(/^\d{10}$/, "Account number must be 10 digits."),
});

export const saveBankAccountSchema = verifyBankAccountSchema.extend({
  account_name: z.string().min(1, "Account name is required."),
  bank_name: z.string().min(1, "Bank name is required."),
});

export type VerifyBankAccountInput = z.infer<typeof verifyBankAccountSchema>;
export type SaveBankAccountInput = z.infer<typeof saveBankAccountSchema>;
