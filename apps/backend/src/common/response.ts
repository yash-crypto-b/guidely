import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, message?: string) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function sendError(res: Response, statusCode: number, message: string, errors?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
