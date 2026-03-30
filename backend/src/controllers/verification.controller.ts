/**
 * Verification Controller – thin HTTP adapter layer.
 *
 * Each method:
 *  1. Extracts validated data from the request (params / query are already
 *     validated by route middleware before reaching here).
 *  2. Delegates to the verification service layer.
 *  3. Wraps the result in the standard ApiResponse envelope.
 *  4. Forwards any errors to the global error handler via `next(err)`.
 *
 * No business logic lives here.
 */
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { verificationService } from "../services/verification.service";

export class VerificationController {
  /**
   * GET /api/v1/verify/status/:jobId
   * Returns the full VerificationJob document for the given jobId.
   *
   * Access control:
   *  - Pass `?requesterId=<ObjectId>` to authenticate as the job creator.
   *  - Without it, only jobs whose asset has accessPolicy "public" are readable.
   */
  async getStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      const requesterId = req.query.requesterId as string | undefined;

      const job = await verificationService.getVerificationStatus(
        jobId,
        requesterId
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const verificationController = new VerificationController();
