import { z } from "zod";

export const auditSchema = z.object({
  tool: z.string(),
  plan: z.string(),

  monthlySpend: z.number(),

  seats: z.number(),

  teamSize: z.number(),

  useCase: z.string(),
});

export type AuditFormData = z.infer<typeof auditSchema>;