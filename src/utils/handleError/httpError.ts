export interface HttpError extends Error {
  statusCode: number;
}

export function httpError(statusCode: number, message: string): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  return err;
}
