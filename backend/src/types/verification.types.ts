/**
 * Domain types for the Verification Status endpoint.
 * The canonical IVerificationJob shape is defined in models/VerificationJob.model.ts.
 */

/** Standard JSON envelope returned by every endpoint. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
