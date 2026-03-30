/**
 * Verification Service – business logic for the verification status endpoint.
 *
 * Retrieves a single VerificationJob by its MongoDB ObjectId, then enforces
 * read-access rules:
 *   - The job creator may always read their own job.
 *   - Any caller may read a job whose associated asset has accessPolicy "public".
 *   - All other callers receive 403 Forbidden.
 *
 * The `requesterId` query parameter is optional. When absent only public jobs
 * are accessible without a 403.
 */
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import VerificationJob from "../models/VerificationJob.model";
import Asset from "../models/Asset.model";
import { AppError } from "../errors/AppError";

/**
 * Returns the full VerificationJob document for the given jobId.
 *
 * @param jobId       MongoDB ObjectId string of the VerificationJob.
 * @param requesterId Optional MongoDB ObjectId string of the requesting user.
 *
 * @throws {AppError} 400 – jobId or requesterId is not a valid ObjectId.
 * @throws {AppError} 403 – caller is not the creator and asset is not public.
 * @throws {AppError} 404 – no VerificationJob found for the given jobId.
 */
async function getVerificationStatus(
  jobId: string,
  requesterId?: string
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(
      "jobId must be a valid MongoDB ObjectId",
      StatusCodes.BAD_REQUEST,
      "INVALID_JOB_ID"
    );
  }

  if (requesterId !== undefined && !mongoose.Types.ObjectId.isValid(requesterId)) {
    throw new AppError(
      "requesterId must be a valid MongoDB ObjectId",
      StatusCodes.BAD_REQUEST,
      "INVALID_REQUESTER_ID"
    );
  }

  const job = await VerificationJob.findById(jobId).lean<Record<string, unknown>>();

  if (!job) {
    throw new AppError(
      `VerificationJob not found: '${jobId}'`,
      StatusCodes.NOT_FOUND,
      "JOB_NOT_FOUND"
    );
  }

  const creatorId = (job.creatorId as mongoose.Types.ObjectId).toString();
  const isCreator = requesterId !== undefined && requesterId === creatorId;

  if (!isCreator) {
    // Fall back to asset access policy to allow public reads.
    const assetId = job.assetId as mongoose.Types.ObjectId;
    const asset = await Asset.findById(assetId)
      .select("accessPolicy")
      .lean<{ accessPolicy?: string }>();

    const isPublic = asset?.accessPolicy === "public";

    if (!isPublic) {
      throw new AppError(
        "Access denied: you must be the job creator or the asset must be public",
        StatusCodes.FORBIDDEN,
        "ACCESS_DENIED"
      );
    }
  }

  return job;
}

export const verificationService = {
  getVerificationStatus,
} as const;
