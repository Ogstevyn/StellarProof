/**
 * Certificate Service – business logic for retrieving a user's certificate portfolio.
 *
 * Queries the Certificate collection filtered by `creatorId` (the MongoDB
 * ObjectId of the certificate owner / user).
 *
 * Pagination uses MongoDB `skip` / `limit` with a parallel `countDocuments`
 * call so the caller always knows the full result-set size.
 */
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Certificate from "../models/Certificate.model";
import { AppError } from "../errors/AppError";
import type {
  ListCertificatesQuery,
  CertificateListResult,
} from "../types/certificate.types";

/**
 * Returns a paginated list of certificates belonging to the given creator.
 * Results are sorted newest-first (`createdAt` descending).
 *
 * @throws {AppError} 400 – if `creatorId` is not a valid ObjectId.
 * @throws {AppError} 400 – if `limit` or `skip` are out of range.
 */
async function listCertificates(
  query: ListCertificatesQuery
): Promise<CertificateListResult> {
  const { creatorId, limit, skip } = query;

  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    throw new AppError(
      "creatorId must be a valid MongoDB ObjectId",
      StatusCodes.BAD_REQUEST,
      "INVALID_CREATOR_ID"
    );
  }

  if (limit < 1 || limit > 100) {
    throw new AppError(
      "limit must be between 1 and 100",
      StatusCodes.BAD_REQUEST,
      "INVALID_PAGINATION"
    );
  }

  if (skip < 0) {
    throw new AppError(
      "skip must be a non-negative integer",
      StatusCodes.BAD_REQUEST,
      "INVALID_PAGINATION"
    );
  }

  const filter = { creatorId: new mongoose.Types.ObjectId(creatorId) };

  const [certificates, total] = await Promise.all([
    Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<Record<string, unknown>[]>(),
    Certificate.countDocuments(filter),
  ]);

  return { certificates, total, limit, skip };
}

export const certificateService = {
  listCertificates,
} as const;
