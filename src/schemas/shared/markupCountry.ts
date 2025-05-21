import {z} from "zod";

export const MarkupCountrySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type MarkupPlaceCountry = z.infer<typeof MarkupCountrySchema>;
