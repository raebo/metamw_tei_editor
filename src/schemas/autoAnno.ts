import { z } from 'zod';

export const AutoAnnoJobSchema = z.object({
  id: z.number(),
  service_identifier: z.string().nullable(),
  status: z.union([z.number(), z.string()]),
  search_string: z.string().nullable(),
  updated_at: z.union([z.string(), z.boolean()]),
  letters_count: z.number(),
  snippets_count: z.number(),
  letters_open: z.number(),
  letters_closed: z.number(),
  snippets_open: z.number(),
  snippets_closed: z.number(),
});

export const AutoAnnoLockingUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  locked_since: z.string().nullable(),
});

export const AutoAnnoStatusSchema = z.object({
  status: z.string(),
});

export const AutoAnnoErrorSchema = z.object({
  error: z.string(),
});

export const AutoAnnoStatusErrorSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
});

export const AutoAnnoUnauthorizedSchema = z.object({
  message: z.string(),
});

export const AutoAnnoJobLetterListSchema = z.object({
  id: z.number(),
  letter_auto_anno_job_id: z.number(),
  letter_name: z.string(),
  status: z.union([z.number(), z.string()]),
  snippets_count: z.number(),
  snippets_open: z.number(),
  snippets_closed: z.number(),
  locking_user: AutoAnnoLockingUserSchema.nullable(),
});

export const AutoAnnoJobLetterSchema = AutoAnnoJobLetterListSchema.extend({
  xml_content: z.string().nullable(),
  content_changed: z.boolean(),
});

export const SnippetReferenceSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string().nullable(),
  type: z.string(),
});

export const AutoAnnoSnippetSchema = z.object({
  id: z.number(),
  xml_id: z.string().nullable(),
  letter_auto_anno_letter_id: z.number(),
  status: z.union([z.number(), z.string()]),
  references: z.array(SnippetReferenceSchema),
  reference_key_final: z.string().nullable(),
  reference_type_final: z.string().nullable(),
  reference_name_final: z.string().nullable(),
});

export const SnippetApiEntitySchema = z.object({
  entity_id: z.number(),
  entity_key: z.string().nullable(),
  entity_type: z.string().nullable(),
  entity_name: z.string().nullable(),
  entity_display_name: z.string().nullable(),
  entity_settlement_kind: z.union([z.string(), z.boolean()]).nullable(),
  entity_place_country_name: z.union([z.string(), z.boolean()]).nullable(),
  entity_kind: z.string().nullable(),
  extra_data: z.union([z.record(z.unknown()), z.boolean()]).nullable(),
});

export type AutoAnnoJobApi = z.infer<typeof AutoAnnoJobSchema>;
export type AutoAnnoJobLetterListApi = z.infer<typeof AutoAnnoJobLetterListSchema>;
export type AutoAnnoJobLetterApi = z.infer<typeof AutoAnnoJobLetterSchema>;
export type AutoAnnoSnippetApi = z.infer<typeof AutoAnnoSnippetSchema>;

export interface AutoAnnoLockingRequest {
  automatic_anno_letter: {
    userId: number | null;
  };
}

export const autoAnnoLockingRequest = (userId: number | null): AutoAnnoLockingRequest => ({
  automatic_anno_letter: { userId },
});
