import { z } from 'zod';
import { EntityType } from '@src/constants/editor';

const entityKeySchema = z.object({ key: z.string().min(1) });
const countryReferenceSchema = z.object({ id: z.number().int() });
const settlementReferenceSchema = z.object({ key: z.string().min(1) });

const personRequestSchema = z.object({
  entity_type: z.literal(EntityType.PERSON),
  entityData: entityKeySchema.extend({
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }),
});

const settlementRequestSchema = z.object({
  entity_type: z.literal(EntityType.SETTLEMENT),
  entityData: entityKeySchema.extend({
    name: z.string().min(1),
    kind: z.string().nullable(),
    country: countryReferenceSchema,
  }),
});

const sightRequestSchema = z.object({
  entity_type: z.literal(EntityType.SIGHT),
  entityData: entityKeySchema.extend({
    name: z.string().min(1),
    settlement: settlementReferenceSchema,
    country: countryReferenceSchema,
  }),
});

const institutionRequestSchema = z.object({
  entity_type: z.literal(EntityType.INSTITUTION),
  entityData: entityKeySchema.extend({
    name: z.string().min(1),
    kind: z.string().nullable(),
    settlement: settlementReferenceSchema,
    country: countryReferenceSchema,
  }),
});

const creationRequestSchema = z.object({
  entity_type: z.literal(EntityType.CREATION),
  entityData: entityKeySchema.extend({
    name: z.string().min(1),
    kind: z.string().nullable(),
    author: entityKeySchema,
  }),
});

const protagCreationRequestSchema = z.object({
  entity_type: z.literal(EntityType.PROTAG_CREATION),
  entityData: entityKeySchema.extend({
    name: z.string().min(1),
    protag_creation_category: z.object({ id: z.number().int() }),
    mwv: z.string().nullable(),
    op: z.string().nullable(),
  }),
});

export const EntityCreateRequestSchema = z.discriminatedUnion('entity_type', [
  personRequestSchema,
  settlementRequestSchema,
  sightRequestSchema,
  institutionRequestSchema,
  creationRequestSchema,
  protagCreationRequestSchema,
]);

export type EntityCreateRequest = z.infer<typeof EntityCreateRequestSchema>;

export const EntityCreatedResponseSchema = z
  .object({
    entity_key: z.string().min(1),
  })
  .strict();

export const EntityCreateErrorSchema = z.object({
  error: z.enum(['invalid_entity_data', 'entity_creation_failed']),
});

export type EntityCreateErrorCode = z.infer<typeof EntityCreateErrorSchema>['error'];
