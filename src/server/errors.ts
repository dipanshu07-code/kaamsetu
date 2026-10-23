/**
 * Errors carry a stable `code` that the client translates (errors.<code>).
 * Messages are never built from internal details.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public fields?: Record<string, string>,
  ) {
    super(code);
  }
}

export const badRequest = (code = 'invalid_request', fields?: Record<string, string>) =>
  new ApiError(400, code, fields);
export const unauthorized = () => new ApiError(401, 'login_required');
export const forbidden = (code = 'forbidden') => new ApiError(403, code);
export const notFound = (code = 'not_found') => new ApiError(404, code);
export const conflict = (code: string) => new ApiError(409, code);
export const tooMany = () => new ApiError(429, 'too_many_requests');

/** Postgres error codes we translate into user-facing conflicts. */
export function isExclusionViolation(e: unknown) {
  return (e as { code?: string })?.code === '23P01';
}
export function isUniqueViolation(e: unknown) {
  return (e as { code?: string })?.code === '23505';
}
