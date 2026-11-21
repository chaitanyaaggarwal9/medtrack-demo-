import { idSchema } from '../../src/lib/validation.ts';
import { HttpError } from './http.ts';

/**
 * The signed-in user's id. Until Google sign-in exists (next week), every
 * request acts as DEMO_USER_ID from the environment. Next week this
 * becomes requireUser(), which reads the session cookie instead.
 *
 * Fails closed: if DEMO_USER_ID is missing or not a uuid, the request is
 * refused. It never falls back to "all users".
 */
export function getCurrentUserId(): string {
  const result = idSchema.safeParse(process.env.DEMO_USER_ID);
  if (!result.success) {
    throw new HttpError(
      500,
      'The app is not set up yet. Please try again later.',
    );
  }
  return result.data;
}
