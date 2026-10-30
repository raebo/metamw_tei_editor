import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.number().int(),
  login: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  language: z.string().nullable(),
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
});

export const AuthMessageSchema = z.object({
  message: z.string(),
});

export type AuthUserApi = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type AuthMessage = z.infer<typeof AuthMessageSchema>;
