import { z } from 'zod';

export const MarkupPlaceSettlementSchema = z.object({
  key: z.string(),
  type: z.string(),
  name: z.string(),
});

export type MarkupPlaceSettlement = z.infer<typeof MarkupPlaceSettlementSchema>;
