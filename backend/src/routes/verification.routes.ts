/**
 * Verification Routes – request validation schemas and route definitions.
 *
 * Endpoints:
 *   GET /api/v1/verify/status/:jobId?requesterId=<ObjectId>
 *     Returns the full VerificationJob document for the given job.
 *     Access is restricted to the job creator or public-asset jobs.
 *
 * All Zod schemas are co-located with the routes that use them.
 */
import { Router } from "express";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { verificationController } from "../controllers/verification.controller";

// ---------------------------------------------------------------------------
// Shared validation
// ---------------------------------------------------------------------------
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const jobIdParamSchema = z.object({
  jobId: z
    .string()
    .regex(OBJECT_ID_REGEX, "jobId must be a valid MongoDB ObjectId (24 hex chars)"),
});

const statusQuerySchema = z.object({
  requesterId: z
    .string()
    .regex(OBJECT_ID_REGEX, "requesterId must be a valid MongoDB ObjectId")
    .optional(),
});

// ---------------------------------------------------------------------------
// Validation middleware
// ---------------------------------------------------------------------------
function validateJobIdParam(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = jobIdParamSchema.safeParse(req.params);
  if (!result.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Invalid route parameter",
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  next();
}

function validateStatusQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = statusQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Invalid query parameters",
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = Router();

/**
 * GET /api/v1/verify/status/:jobId
 *
 * Route parameters:
 *   - jobId  (required) – MongoDB ObjectId of the VerificationJob.
 *
 * Query parameters:
 *   - requesterId  (optional) – MongoDB ObjectId of the requesting user.
 *                               Required to access private/creator-only jobs.
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { ...IVerificationJob }
 * }
 *
 * Response 400 – invalid jobId / requesterId format.
 * Response 403 – caller is not the creator and asset is not public.
 * Response 404 – no job found for the given jobId.
 */
router.get(
  "/status/:jobId",
  validateJobIdParam,
  validateStatusQuery,
  verificationController.getStatus.bind(verificationController)
);

export default router;
