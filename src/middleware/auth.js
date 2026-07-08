import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/api-error.js";

export async function requireAuth(req, _res, next) {
  try {
    // Extract token from cookie
    const token = req.cookies.token;
    
    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key");
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid authentication token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Authentication token expired"));
    }
    return next(error instanceof ApiError ? error : new ApiError(401, "Authentication failed"));
  }
}

export function requireRole(roles = []) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    return next();
  };
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key");
    const user = await User.findById(decoded.userId).select("-password");
    
    if (user) req.user = user;
    return next();
  } catch (error) {
    return next();
  }
}
