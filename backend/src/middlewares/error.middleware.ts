import { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';

interface ApiError extends Error {
  statusCode?: number;
  status?: 'fail' | 'error';
  isOperational?: boolean;
  keyValue?: Record<string, unknown>;
}

interface ErrorResponsePayload {
  status: 'fail' | 'error';
  message: string;
  errors?: string[];
  stack?: string;
}

const isProduction = process.env.NODE_ENV === 'production';

const buildMongooseValidationErrors = (error: mongoose.Error.ValidationError): string[] =>
  Object.values(error.errors).map((validationError) => validationError.message);

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const error: ApiError = {
    ...err,
    message: err.message,
    name: err.name,
    stack: err.stack,
    statusCode: err.statusCode ?? 500,
    status: err.status ?? 'error',
  };

  if (error.name === 'CastError') {
    const castError = err as mongoose.Error.CastError;
    error.statusCode = 400;
    error.status = 'fail';
    error.message = `Invalid ${castError.path}: ${castError.value}`;
  }

  if (error.name === 'ValidationError') {
    const validationError = err as mongoose.Error.ValidationError;
    error.statusCode = 400;
    error.status = 'fail';
    error.message = 'Validation failed for one or more fields';
  }

  if ((err as { code?: number }).code === 11000) {
    const duplicateError = err as ApiError;
    const duplicateField = Object.keys(duplicateError.keyValue ?? {})[0] ?? 'field';
    error.statusCode = 409;
    error.status = 'fail';
    error.message = `Duplicate value for ${duplicateField}. Please use a different value.`;
  }

  const responseBody: ErrorResponsePayload = {
    status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
    message: error.message || 'An unexpected error occurred',
  };

  if (error.name === 'ValidationError') {
    responseBody.errors = buildMongooseValidationErrors(err as mongoose.Error.ValidationError);
  }

  if (!isProduction && error.stack) {
    responseBody.stack = error.stack;
  }

  res.status(error.statusCode ?? 500).json(responseBody);
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`) as ApiError;
  error.statusCode = 404;
  error.status = 'fail';
  next(error);
};
