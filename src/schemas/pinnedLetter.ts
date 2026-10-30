import { z } from 'zod';

const pinnedLetterStatusResponseSchema = z
  .object({
    pinned: z.boolean(),
    message: z.literal('Pinned state updated'),
  })
  .strict();

export interface PinnedLetterStatusResponse {
  pinned: boolean;
  message: string;
}

export const parsePinnedLetterStatusResponse = (value: unknown): PinnedLetterStatusResponse => {
  return pinnedLetterStatusResponseSchema.parse(value);
};
