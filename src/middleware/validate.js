import { ApiError } from "../utils/api-error.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ApiError(422, "Validation failed", result.error.flatten()));
    }
    req[source] = result.data;
    return next();
  };
}
