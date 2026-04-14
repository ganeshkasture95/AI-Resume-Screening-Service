import { z } from "zod";

export const scoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.enum(["strong_fit", "moderate_fit", "weak_fit"]),
  missing_requirements: z.array(z.string()),
  justification: z.string().min(1),
});

export type ScoreResult = z.infer<typeof scoreSchema>;

