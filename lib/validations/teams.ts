import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Missing invite token."),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid("Invalid member ID."),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
