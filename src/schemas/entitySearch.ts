import { z } from 'zod';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';

const entitySearchCategories = ['person', 'settlement', 'sight', 'institution', 'creation', 'protag_creation'] as const;

export type EntitySearchCategory = (typeof entitySearchCategories)[number];

const EntitySearchEntrySchema = z.object({
  id: z.number(),
  entityKey: z.string(),
  entityName: z.string(),
});

const PersonSearchEntrySchema = EntitySearchEntrySchema.extend({
  entityLastName: z.string().nullable(),
  entityFirstName: z.string().nullable(),
});

const EntryCollectionSchema = z.object({
  entries: z.array(EntitySearchEntrySchema),
});

const PersonCollectionSchema = z.object({
  entries: z.array(PersonSearchEntrySchema),
});

const EntitySearchResponseSchema = z.object({
  id: z.string().nullable(),
  first_tab: z.enum(entitySearchCategories),
  person: PersonCollectionSchema.optional(),
  settlement: EntryCollectionSchema.optional(),
  sight: EntryCollectionSchema.optional(),
  institution: EntryCollectionSchema.optional(),
  creation: EntryCollectionSchema.optional(),
  protag_creation: EntryCollectionSchema.optional(),
});

export const entitySearchCategory = (entityType: string): EntitySearchCategory => {
  const category = entityType.toLowerCase();
  const result = entitySearchCategories.find((candidate) => candidate === category);

  if (!result) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  return result;
};

export const parseEntitySearchResponse = (value: unknown, entityType: string): SnippetEntity[] => {
  const category = entitySearchCategory(entityType);
  const response = EntitySearchResponseSchema.parse(value);
  const collection = response[category];

  if (!collection) {
    throw new Error(`Entity search response is missing category: ${category}`);
  }

  return collection.entries.map((entry) => ({
    entityId: entry.id,
    entityType,
    entityKey: entry.entityKey,
    entityName: entry.entityName,
    entityFirstName: 'entityFirstName' in entry ? (entry.entityFirstName ?? undefined) : undefined,
    entityLastName: 'entityLastName' in entry ? (entry.entityLastName ?? undefined) : undefined,
    entityDisplayName: entry.entityName,
    extraData: {},
  }));
};
