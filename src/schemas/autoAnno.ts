import { z } from 'zod';

export const AutoAnnoJobSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
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
});

export const AutoAnnoJobLetterSchema = z.object({
  id: z.number(),
  letter_name: z.string(),
  status: z.string(),
  xml_content: z.string(),
  // Declared as a required `string` in AutoAnnoJobLetter, but AutoAnnoLetterHandle.tsx already
  // guards it with `!== null && !== undefined`, i.e. the actual API contract is nullable.
  xml_content_updated: z.string().nullable(),
  content_changed: z.boolean(),
  snippets_count: z.number(),
  snippets_open: z.number(),
  snippets_closed: z.number(),
  locking_user: AutoAnnoLockingUserSchema.nullable(),
  updated_at: z.string(),
});

export const SnippetReferenceSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  type: z.string(),
});

export const AutoAnnoSnippetSchema = z.object({
  id: z.number(),
  xml_id: z.string(),
  status: z.string(),
  references: z.array(SnippetReferenceSchema),
  reference_key_final: z.string(),
  reference_type_final: z.string(),
  reference_name_final: z.string(),
});

export const SnippetApiEntitySchema = z.object({
  entity_id: z.number(),
  entity_key: z.string(),
  entity_type: z.string(),
  entity_name: z.string(),
  entity_display_name: z.string(),
  entity_settlement_kind: z.string().optional(),
  entity_parent_name: z.string().optional(),
  entity_place_country_name: z.string().optional(),
  entity_kind: z.string().optional(),
  extra_data: z.record(z.unknown()),
});

export const SnippetEntitySchema = z.object({
  entityId: z.number(),
  entityType: z.string(),
  entityKey: z.string(),
  entityName: z.string(),
  entityFirstName: z.string().optional(),
  entityLastName: z.string().optional(),
  entityDisplayName: z.string(),
  entitySettlementKind: z.string().optional(),
  entityParentName: z.string().optional(),
  entityPlaceCountryName: z.string().optional(),
  entityKind: z.string().optional(),
  extraData: z.record(z.unknown()),
});
