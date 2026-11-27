import type { z } from 'zod';
import type { ApiErrorBody } from '../../src/lib/api-types.ts';
import { fieldErrors } from '../../src/lib/validation.ts';

/** Largest JSON body we accept (our bodies are tiny). */
export const MAX_BODY_BYTES = 10_000;

/** An error we expect, with a safe message for the user. */
export class HttpError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    if (fields) this.fields = fields;
  }
}

export function errorResponse(
  status: number,
  message: string,
  fields?: Record<string, string>,
  headers?: Record<string, string>,
): Response {
  const body: ApiErrorBody = fields
    ? { error: message, fields }
    : { error: message };
  return Response.json(body, { status, ...(headers ? { headers } : {}) });
}

export function methodNotAllowed(allowed: string[]): Response {
  return errorResponse(405, 'That method is not allowed here.', undefined, {
    Allow: allowed.join(', '),
  });
}

/** Reads a small JSON body, or throws a 400 / 413 HttpError. */
export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'The request is too large.');
  }
  if (text.trim() === '') throw new HttpError(400, 'Send the data as JSON.');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, 'The data is not valid JSON.');
  }
}

/** Checks data with a Zod schema, or throws a 400 with per-field messages. */
export function parseOr400<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(
      400,
      'Please check the highlighted fields.',
      fieldErrors(result.error),
    );
  }
  return result.data;
}

/**
 * Wraps a handler: expected errors become their status code; anything else
 * becomes a friendly 500. Only the error's name is logged, never messages
 * that could hold data or connection strings.
 */
export function withErrors<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return errorResponse(error.status, error.message, error.fields);
      }
      console.error(
        'API error:',
        error instanceof Error ? error.name : 'unknown error',
      );
      return errorResponse(500, 'Something went wrong. Please try again.');
    }
  };
}
