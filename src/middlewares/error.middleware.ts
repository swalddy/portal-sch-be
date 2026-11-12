import { Elysia } from 'elysia';
import { Prisma } from '@/generated/prisma/client';
import { AppError } from '@/utils/errors.util';
import { errorResponse } from '@/utils/response.util';

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'A record with this unique value already exists' },
  P2003: { status: 400, message: 'Referenced record does not exist' },
  P2025: { status: 404, message: 'Record not found' },
};

export const errorMiddleware = new Elysia({ name: 'error-middleware' })
  .error({ AppError })
  .onError({ as: 'global' }, ({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return errorResponse(error.message, error.details);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[error.code];
      if (mapped) {
        set.status = mapped.status;
        return errorResponse(mapped.message);
      }
      set.status = 400;
      return errorResponse('Database request failed');
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      set.status = 400;
      return errorResponse('Invalid database query parameters');
    }

    switch (code) {
      case 'NOT_FOUND':
        set.status = 404;
        return errorResponse('Resource not found');

      case 'VALIDATION': {
        set.status = 422;
        const details =
          typeof error === 'object' && error !== null && 'all' in error
            ? (error as { all: unknown }).all
            : typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error);
        return errorResponse('Validation failed', details);
      }

      case 'PARSE':
        set.status = 400;
        return errorResponse('Invalid request body or parameters');

      case 'INTERNAL_SERVER_ERROR':
      default: {
        const currentStatus = typeof set.status === 'number' && set.status >= 400 ? set.status : 500;
        set.status = currentStatus;

        const errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : 'An unexpected internal server error occurred';

        const errorStack =
          process.env.NODE_ENV === 'development' &&
          typeof error === 'object' &&
          error !== null &&
          'stack' in error
            ? (error as { stack?: string }).stack
            : undefined;

        return errorResponse(errorMessage, errorStack);
      }
    }
  });
