import { z } from 'zod';

export const LetterExistsResponseSchema = z.boolean();

export const LetterXmlContentResponseSchema = z.string().nullable();

export const EntityKeyResponseSchema = z.object({
  entity_key: z.string(),
});
