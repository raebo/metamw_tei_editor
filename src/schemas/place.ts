import { z } from 'zod';
import { MarkupPlaceSettlementSchema } from './shared/markupPlaceSettlement';
import {MarkupCountrySchema} from "./shared/markupCountry";

export const RemotePlaceDataSchema = z.object({
  id: z.number().nullable().optional(),
  key: z.string().nullable(),
  name: z.string().nullable(),
  country: MarkupCountrySchema,
  kind: z.string().nullable(),
  settlement: MarkupPlaceSettlementSchema.optional().nullable(),
});

// Inferred types
export type PlaceFormData = z.infer<typeof RemotePlaceDataSchema>;
