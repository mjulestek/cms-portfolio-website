import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export function apiError(code: ApiErrorCode, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

function isPrismaKnownRequestError(error: unknown): error is { code: string; meta?: unknown } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string';
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(
      'VALIDATION_ERROR',
      'Request validation failed',
      400,
      error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
    );
  }

  if (isPrismaKnownRequestError(error)) {
    if (error.code === 'P2002') return apiError('CONFLICT', 'A record with this unique value already exists', 409, error.meta);
    if (error.code === 'P2025') return apiError('NOT_FOUND', 'Record not found', 404);
  }

  console.error(error);
  return apiError('INTERNAL_ERROR', 'Unexpected server error', 500);
}
