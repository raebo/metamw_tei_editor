import { z } from 'zod';

const requiredFieldsByPrefix = {
  PSN: [
    'id',
    'key',
    'full_name',
    'display_name',
    'birth_date',
    'death_date',
    'birth_alt',
    'death_alt',
    'birth',
    'baptism',
    'baptism_date',
    'place_of_birth',
    'place_of_death',
    'background',
    'married_to',
    'gender',
    'death',
    'relation',
    'volumes',
    'msb_supplement',
  ],
  STM: ['id', 'key', 'name', 'info', 'notes', 'kind', 'country', 'country_name', 'gnd'],
  NST: [
    'id',
    'key',
    'name',
    'kind',
    'info',
    'notes',
    'data',
    'index_name',
    'settlement',
    'misc_settlement_name',
    'country',
    'country_name',
  ],
  SGH: [
    'id',
    'key',
    'name',
    'kind',
    'info',
    'notes',
    'data',
    'gnd',
    'index_name',
    'settlement',
    'misc_settlement_name',
    'country',
    'country_name',
  ],
  PRC: ['id', 'name', 'key', 'mwv', 'op', 'protag_creation_category', 'protag_creation_category_list'],
} as const;

type SupportedEntityPrefix = keyof typeof requiredFieldsByPrefix;

const entityDetailsSchema = z.object({ id: z.number().int() }).catchall(z.unknown());

export const remotePersonTransportSchema = entityDetailsSchema.extend({
  key: z.string().nullable(),
  full_name: z.string().nullable(),
  display_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  death_date: z.string().nullable(),
  birth_alt: z.unknown(),
  death_alt: z.unknown(),
  birth: z.unknown(),
  baptism: z.unknown(),
  baptism_date: z.unknown(),
  place_of_birth: z.string().nullable(),
  place_of_death: z.string().nullable(),
  background: z.unknown(),
  married_to: z.unknown(),
  gender: z.unknown(),
  death: z.unknown(),
  relation: z.string().nullable(),
  volumes: z.unknown(),
  msb_supplement: z.unknown(),
});

export type EntityDetails = z.infer<typeof entityDetailsSchema>;
export type RemotePersonTransport = z.infer<typeof remotePersonTransportSchema>;

const entityPrefix = (entityKey: string): SupportedEntityPrefix => {
  const prefix = entityKey.slice(0, 3).toUpperCase();
  if (prefix in requiredFieldsByPrefix) return prefix as SupportedEntityPrefix;
  throw new Error(`Unsupported entity key prefix: ${prefix}`);
};

export const parseEntityDetails = (entityKey: string, value: unknown): EntityDetails => {
  const prefix = entityPrefix(entityKey);
  if (prefix === 'PSN') return remotePersonTransportSchema.parse(value);

  return entityDetailsSchema
    .superRefine((details, context) => {
      requiredFieldsByPrefix[prefix].forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(details, field)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `Required entity detail field is missing: ${field}`,
          });
        }
      });
    })
    .parse(value);
};

export const parseRemotePersonTransport = (value: unknown): RemotePersonTransport => remotePersonTransportSchema.parse(value);
