export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
  timestamp: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    ...(message ? { message } : {}),
    data,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(message: string, error?: unknown): ApiResponse {
  return {
    success: false,
    message,
    ...(error !== undefined ? { error } : {}),
    timestamp: new Date().toISOString(),
  };
}

