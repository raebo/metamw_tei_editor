import { z } from 'zod';

export const RismEntryApiSchema = z.object({
  id: z.number().int(),
  title: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  code: z.string().nullable(),
  name: z.string().nullable(),
});

export const CountryApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const MiscLetterApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  title: z.string().nullable(),
  display_name: z.string(),
});

export const AuthorApiSchema = z.object({
  id: z.number().int(),
  key: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  display_name: z.string(),
});

export const ProtagonistPersonApiSchema = z.object({
  id: z.number().int(),
  key: z.string(),
  display_name: z.string(),
});

export const ProtagCreationCategoryApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  protag_creation_category_id: z.number().int().nullable(),
  name_en: z.string().nullable(),
});

export const ProtagCreationApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  protag_creation_category_id: z.number().int(),
  key: z.string(),
  mwv: z.string().nullable(),
  op: z.string().nullable(),
});

export const CreationApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  key: z.string(),
  kind: z.string().nullable(),
});

export const StringListSchema = z.array(z.string());
export const NullableStringListSchema = z.array(z.string().nullable());
