import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { ApiResponse } from '../utils/api-response.util.js';
import { HttpStatus } from '../constants/http-status.constant.js';
import { ZodError } from 'zod';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, undefined, err.statusCode);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    const mainMsg = err.errors[0]?.message || 'Input data tidak valid';
    return ApiResponse.error(res, mainMsg, formattedErrors, HttpStatus.BAD_REQUEST);
  }

  console.error('Unhandled Server Error:', err);
  return ApiResponse.error(
    res,
    'Internal Server Error',
    process.env.NODE_ENV === 'development' ? err.message : undefined,
    HttpStatus.INTERNAL_SERVER_ERROR
  );
};
