import { ApiError } from "../utils/api-error.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message;

  // Handle MongoDB duplicate key error
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0];
    message = `This ${field || 'value'} is already taken. Please try another one.`;
  }

  req.log.error({ error, statusCode }, message);

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : message,
    details: error.details,
  });
}
