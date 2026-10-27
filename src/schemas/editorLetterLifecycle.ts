import { z } from 'zod';

export const letterActionReasonCodeSchema = z.enum([
  'unauthenticated',
  'letter_not_found',
  'letter_provenance_unknown',
  'not_letter_creator',
  'letter_already_published',
  'letter_state_inconsistent',
  'letter_has_other_working_copies',
  'letter_has_pending_writes',
  'letter_has_incoming_references',
  'letter_has_external_references',
  'letter_file_conflict',
  'letter_version_conflict',
  'letter_history_conflict',
  'letter_name_taken',
  'letter_name_retired',
  'invalid_letter_name',
  'invalid_letter_parameters',
  'letter_index_pending',
  'letter_operation_failed',
  'letter_reference_retired',
  'letter_has_annotation_records',
  'letter_working_copy_missing',
]);

export type LetterActionReasonCode = z.infer<typeof letterActionReasonCodeSchema>;

const letterActionCapabilitySchema = z
  .object({
    allowed: z.boolean(),
    reason_code: letterActionReasonCodeSchema.nullable(),
  })
  .superRefine((capability, context) => {
    if (capability.allowed && capability.reason_code !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An allowed letter action cannot have a blocking reason',
      });
    }
  });

export const letterCapabilitiesSchema = z.object({
  rename: letterActionCapabilitySchema,
  discard: letterActionCapabilitySchema,
});

export const letterVersionSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const letterLifecycleSchema = z.object({
  capabilities: letterCapabilitiesSchema,
  version: letterVersionSchema,
});

export const letterActionErrorSchema = z.object({
  error: letterActionReasonCodeSchema,
});

export type LetterActionCapability = {
  allowed: boolean;
  reasonCode: LetterActionReasonCode | null;
};

export type LetterCapabilities = {
  rename: LetterActionCapability;
  discard: LetterActionCapability;
};

export type LetterLifecycle = {
  capabilities: LetterCapabilities;
  version: string;
};

export const parseLetterLifecycle = (value: unknown): LetterLifecycle => {
  const parsed = letterLifecycleSchema.parse(value);

  return {
    capabilities: {
      rename: {
        allowed: parsed.capabilities.rename.allowed,
        reasonCode: parsed.capabilities.rename.reason_code,
      },
      discard: {
        allowed: parsed.capabilities.discard.allowed,
        reasonCode: parsed.capabilities.discard.reason_code,
      },
    },
    version: parsed.version,
  };
};
