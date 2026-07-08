import { ApiError } from "../utils/api-error.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  req.log.error({ error, statusCode }, error.message);

  res.status(statusCode).json({
    error: statusCode === 500 ? error.message : error.message,
    details: error.details,
  });
}
