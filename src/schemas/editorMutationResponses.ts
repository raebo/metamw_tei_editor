import { z } from 'zod';

export const MessageResponseSchema = z.object({
  message: z.string(),
});

export const SuccessMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const PublishLetterResponseSchema = z.object({
  message: z.string(),
  letter_id: z.number().int(),
});

export const RevisionStatusSchema = z.enum(['draft', 'live']);
export type RevisionStatus = z.infer<typeof RevisionStatusSchema>;

export const InvalidRevisionStatusResponseSchema = z.object({
  error: z.literal('invalid_revision_status'),
});

export const UndoRedoResponseSchema = z.object({
  content: z.string(),
  undo_available: z.boolean(),
  redo_available: z.boolean(),
});
