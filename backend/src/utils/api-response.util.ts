import { Response } from 'express';
import { HttpStatus, HttpStatusCode } from '../constants/http-status.constant.js';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

export class ApiResponse {
  static success<T>(res: Response, message: string, data?: T, statusCode: HttpStatusCode = HttpStatus.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    } satisfies ApiResponsePayload<T>);
  }

  static error(res: Response, message: string, error?: unknown, statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR) {
    return res.status(statusCode).json({
      success: false,
      message,
      error
    } satisfies ApiResponsePayload);
  }
}
