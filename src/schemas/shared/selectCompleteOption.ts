import { z } from 'zod';

export const SelectCompleteOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type SelectCompleteOption = z.infer<typeof SelectCompleteOptionSchema>;
