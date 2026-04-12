/**
 * Extract a human-readable error message from a FastAPI error response.
 * Handles both string `detail` and Pydantic validation error arrays.
 */
export function extractApiError(data: any, fallback = 'Something went wrong'): string {
  if (!data?.detail) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
  }
  return fallback;
}
