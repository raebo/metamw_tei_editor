import axios from 'axios';
import { z } from 'zod';

const legacyMiscErrorSchema = z.object({ error: z.string() });
const unauthorizedMiscErrorSchema = z.object({ message: z.string() });

const httpErrorResponse = (error: unknown): { status: number; data?: unknown } | undefined => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;

  const parsed = z.object({ response: z.object({ status: z.number().int(), data: z.unknown() }) }).safeParse(error);
  return parsed.success ? parsed.data.response : undefined;
};

export class JwtMiscRequestError extends Error {
  constructor(
    readonly operation: string,
    readonly status: number | undefined,
    readonly backendMessage: string | undefined,
  ) {
    const detail = backendMessage ?? (status === undefined ? 'Network request failed' : `HTTP ${status}`);
    super(`${operation}: ${detail}`);
    this.name = 'JwtMiscRequestError';
  }
}

export const throwMiscRequestError = (operation: string, error: unknown): never => {
  const response = httpErrorResponse(error);
  if (response) {
    const errorBody = legacyMiscErrorSchema.safeParse(response.data);
    const unauthorizedBody = unauthorizedMiscErrorSchema.safeParse(response.data);
    const backendMessage = errorBody.success ? errorBody.data.error : unauthorizedBody.success ? unauthorizedBody.data.message : undefined;

    throw new JwtMiscRequestError(operation, response.status, backendMessage);
  }

  if (axios.isAxiosError(error)) {
    throw new JwtMiscRequestError(operation, undefined, error.message || undefined);
  }
  if (error instanceof Error) throw error;
  throw new JwtMiscRequestError(operation, undefined, undefined);
};
