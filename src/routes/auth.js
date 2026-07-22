import { Router } from "express";
import { createClerkClient } from "@clerk/backend";

import slugify from "slugify";
import { z } from "zod";
import { User } from "../models/User.js";
import { Staff } from "../models/Staff.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function getClerkClient() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new ApiError(500, "Clerk server key is not configured on the backend.");
  }
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

function getCookieOptions(req) {
  const origin = req.get("origin") || "";
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const isHttpsRequest = req.secure || req.get("x-forwarded-proto") === "https";
  const isProd = process.env.NODE_ENV === "production" || isHttpsRequest;
  const isCrossSite = Boolean(origin) && !isLocalOrigin;

  return {
    httpOnly: true,
    secure: isProd || isCrossSite,
    sameSite: isCrossSite ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function setAuthCookie(req, res, token) {
  res.cookie("token", token, getCookieOptions(req));
}

function clearAuthCookie(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: getCookieOptions(req).secure,
    sameSite: getCookieOptions(req).sameSite,
  });
}

async function findClerkUserIdByEmail(email) {
  if (!process.env.CLERK_SECRET_KEY || !email) return null;
  const users = await getClerkClient().users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  return users.data?.[0]?.id || null;
}

async function deleteClerkUserById(clerkId) {
  if (!clerkId) return false;
  try {
    await getClerkClient().users.deleteUser(clerkId);
    return true;
  } catch (error) {
    const status = error.status || error.statusCode;
    if (status === 404) return false;
    throw error;
  }
}

async function deleteClerkUserForAppUser(user) {
  const clerkId = user.clerkId || await findClerkUserIdByEmail(user.email);
  if (!clerkId) return false;

  return deleteClerkUserById(clerkId);
}

const requiredCoordinate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number({ invalid_type_error: "Restaurant location is required" }).finite()
);

// Validation schemas
const registerOwnerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  clerkId: z.string().optional(),
  photo: z.string().optional(),
  restaurantName: z.string().min(2).max(100),
  city: z.string().min(2).max(50).trim().transform((val) => val.toLowerCase()),
  cuisine: z.string().optional(),
  lat: requiredCoordinate,
  lng: requiredCoordinate,
});

const registerCustomerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  clerkId: z.string().optional(),
  photo: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const employeeLoginSchema = z.object({
  username: z.string().trim().min(2),
  password: z.string(),
});

// GET /api/auth/account-status?email=x@y.com
authRouter.get("/account-status", asyncHandler(async (req, res) => {
  let email;
  try {
    email = z.string().email().parse(String(req.query.email || "").trim().toLowerCase());
  } catch {
    throw new ApiError(400, "Please enter a valid email address.");
  }
  const user = await User.findOne({ email }).select("email role restaurantId clerkId").lean();

  let clerkExists = false;
  if (!user && process.env.CLERK_SECRET_KEY) {
    clerkExists = Boolean(await findClerkUserIdByEmail(email));
  }

  res.json({
    exists: Boolean(user),
    role: user?.role || null,
    hasRestaurant: Boolean(user?.restaurantId),
    clerkExists,
  });
}));

// POST /api/auth/register/owner
authRouter.post("/register/owner", asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = registerOwnerSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(400, error.errors?.[0]?.message || "Validation failed");
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: validated.email });
  if (existingUser) {
    if (existingUser.role !== "owner") {
      throw new ApiError(409, "This email is already registered as a customer. Please use another email.");
    }

    const existingRestaurant = existingUser.restaurantId
      ? await Restaurant.findById(existingUser.restaurantId)
      : null;

    if (existingRestaurant) {
      if (validated.clerkId && existingUser.clerkId !== validated.clerkId) {
        await deleteClerkUserById(validated.clerkId);
      }
      throw new ApiError(409, "Restaurant account already exists. Please login instead.");
    }

    if (!validated.clerkId) {
      throw new ApiError(409, "Email already registered");
    }

    if (!existingUser.clerkId) {
      existingUser.clerkId = validated.clerkId;
      await existingUser.save();
    }

    let slug = slugify(validated.restaurantName, { lower: true, strict: true });
    let counter = 1;
    while (await Restaurant.findOne({ slug })) {
      slug = `${slugify(validated.restaurantName, { lower: true, strict: true })}-${counter}`;
      counter++;
    }

    const restaurant = await Restaurant.create({
      name: validated.restaurantName,
      slug,
      city: validated.city,
      cuisine: validated.cuisine || "Multi-Cuisine",
      address: `${validated.city}, India`,
      ownerId: existingUser._id,
      location: {
        lat: validated.lat,
        lng: validated.lng,
      },
    });

    existingUser.restaurantId = restaurant._id;
    await existingUser.save();

    const token = existingUser.generateAuthToken();
    setAuthCookie(req, res, token);

    return res.status(200).json({
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        restaurantId: existingUser.restaurantId,
        photo: existingUser.photo,
        location: existingUser.location,
      },
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        city: restaurant.city,
        cuisine: restaurant.cuisine,
      },
      token,
    });
  }

  // Generate unique slug for restaurant
  let slug = slugify(validated.restaurantName, { lower: true, strict: true });
  let counter = 1;
  while (await Restaurant.findOne({ slug })) {
    slug = `${slugify(validated.restaurantName, { lower: true, strict: true })}-${counter}`;
    counter++;
  }

  // Create restaurant first
  const restaurant = await Restaurant.create({
    name: validated.restaurantName,
    slug,
    city: validated.city,
    cuisine: validated.cuisine || "Multi-Cuisine",
    address: `${validated.city}, India`,
    location: {
      lat: validated.lat,
      lng: validated.lng,
    },
  });

  const userPayload = {
    name: validated.name,
    email: validated.email,
    role: "owner",
    restaurantId: restaurant._id,
  };
  if (validated.password) userPayload.password = validated.password;
  if (validated.clerkId) userPayload.clerkId = validated.clerkId;
  if (validated.photo) userPayload.photo = validated.photo;

  // Create user with restaurantId
  const user = await User.create(userPayload);

  // Update restaurant with ownerId
  restaurant.ownerId = user._id;
  await restaurant.save();

  // Generate JWT token
  const token = user.generateAuthToken();
  setAuthCookie(req, res, token);

  // Return response (don't send password)
  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      photo: user.photo,
      location: user.location,
    },
    restaurant: {
      _id: restaurant._id,
      name: restaurant.name,
      slug: restaurant.slug,
      city: restaurant.city,
      cuisine: restaurant.cuisine,
    },
    token,
  });
}));

// POST /api/auth/register/customer
authRouter.post("/register/customer", asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = registerCustomerSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(400, error.errors?.[0]?.message || "Validation failed");
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: validated.email });
  if (existingUser) {
    if (validated.clerkId && existingUser.clerkId !== validated.clerkId) {
      await deleteClerkUserById(validated.clerkId);
    }
    throw new ApiError(409, "Email already registered");
  }

  const userPayload = {
    name: validated.name,
    email: validated.email,
    role: "customer",
  };
  if (validated.password) userPayload.password = validated.password;
  if (validated.clerkId) userPayload.clerkId = validated.clerkId;
  if (validated.photo) userPayload.photo = validated.photo;

  // Create user
  const user = await User.create(userPayload);

  // Generate JWT token
  const token = user.generateAuthToken();
  setAuthCookie(req, res, token);

  // Return response
  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      location: user.location,
    },
    token,
  });
}));
const loginVerifiedSchema = z.object({
  email: z.string().email(),
  clerkId: z.string().min(1),
  name: z.string().optional(),
  role: z.enum(["owner", "customer"]),
  photo: z.string().optional(),
});

// POST /api/auth/login-verified (Called by frontend after Clerk OTP/Google success)
authRouter.post("/login-verified", asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = loginVerifiedSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(400, error.errors?.[0]?.message || "Validation failed");
  }

  let user = await User.findOne({ email: validated.email });
  
  if (!user) {
    const accountType = validated.role === "owner" ? "restaurant" : "customer";
    throw new ApiError(404, `Account not found. Please create your ${accountType} account first.`);
  }

  // Role mismatch — show helpful message
  if (user.role !== validated.role) {
    const correctPortal = user.role === "owner" ? "Restaurant Owner" : "Discovery User";
    throw new ApiError(403, `This email belongs to a ${user.role} account. Please use the ${correctPortal} login tab.`);
  }

  // Link clerkId if not already set (Google SSO on existing email/password account)
  if (!user.clerkId && validated.clerkId) {
    user.clerkId = validated.clerkId;
    await user.save();
  }

  // Update photo from Google if not already set
  if (validated.photo && !user.photo) {
    user.photo = validated.photo;
    await user.save();
  }

  const token = user.generateAuthToken();
  setAuthCookie(req, res, token);

  const response = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      photo: user.photo,
      location: user.location,
    },
    token,
  };

  if (user.role === "owner" && user.restaurantId) {
    const restaurant = await Restaurant.findById(user.restaurantId);
    response.restaurant = restaurant;
  }

  res.json(response);
}));

// POST /api/auth/login
authRouter.post("/login", asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = loginSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(400, error.errors?.[0]?.message || "Validation failed");
  }

  // Find user by email
  const user = await User.findOne({ email: validated.email });
  if (!user) {
    throw new ApiError(404, "Account not found. Please create your account first.");
  }

  if (!user.password) {
    throw new ApiError(401, "This account uses Google sign-in. Please continue with Google.");
  }

  // Check password
  const isMatch = await user.comparePassword(validated.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate JWT token
  const token = user.generateAuthToken();
  setAuthCookie(req, res, token);

  // Prepare response
  const response = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      photo: user.photo,
      location: user.location,
    },
    token,
  };

  // If owner, include restaurant data
  if (user.role === "owner" && user.restaurantId) {
    const restaurant = await Restaurant.findById(user.restaurantId);
    response.restaurant = restaurant;
  }

  res.json(response);
}));

// POST /api/auth/employee-login
authRouter.post("/employee-login", asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = employeeLoginSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(400, error.errors?.[0]?.message || "Validation failed");
  }

  // Find staff by username
  const staff = await Staff.findOne({ username: validated.username });
  if (!staff) {
    throw new ApiError(401, "Invalid username or password");
  }

  // Check password
  const isMatch = await staff.comparePassword(validated.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid username or password");
  }
  
  if (staff.status === "Inactive") {
    throw new ApiError(403, "Account is inactive. Please contact the owner.");
  }

  // Generate JWT token
  const token = staff.generateAuthToken();

  // Set httpOnly cookie
  setAuthCookie(req, res, token);

  // Fetch restaurant
  const restaurant = await Restaurant.findById(staff.restaurantId);

  res.json({
    user: {
      _id: staff._id,
      name: staff.name,
      username: staff.username,
      role: "employee", // standardize for frontend
      actualRole: staff.role, // "Chef", "Waiter", etc.
      permissions: staff.permissions,
      restaurantId: staff.restaurantId,
      isEmployee: true
    },
    token,
    restaurant
  });
}));

// GET /api/auth/me
authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const response = {
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      restaurantId: req.user.restaurantId,
      photo: req.user.photo,
      location: req.user.location,
      ...(req.user.isEmployee && {
        isEmployee: true,
        permissions: req.user.permissions,
        actualRole: req.user.actualRole || req.user.role,
        username: req.user.username,
      })
    },
  };

  // If owner or employee, include restaurant data
  if (req.user.restaurantId) {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    response.restaurant = restaurant;
  }

  res.json(response);
}));

// POST /api/auth/logout
authRouter.post("/logout", (req, res) => {
  clearAuthCookie(req, res);
  res.json({ message: "Logged out successfully" });
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  photo: z.string().url().or(z.literal("")).optional(),
  location: z.string().max(100).optional(),
});

// PUT /api/auth/me
authRouter.put("/me", requireAuth, asyncHandler(async (req, res) => {
  let validated;
  try {
    validated = updateProfileSchema.parse(req.body);
  } catch (error) {
    throw new ApiError(400, error.errors?.[0]?.message || "Validation failed");
  }

  if (validated.name) req.user.name = validated.name;
  if (validated.photo !== undefined) req.user.photo = validated.photo;
  if (validated.location !== undefined) req.user.location = validated.location;

  await req.user.save();

  const response = {
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      restaurantId: req.user.restaurantId,
      photo: req.user.photo,
      location: req.user.location,
    },
  };

  if (req.user.role === "owner" && req.user.restaurantId) {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    response.restaurant = restaurant;
  }

  res.json(response);
}));

// DELETE /api/auth/me
// Hard deletes the user. Owners also delete their restaurant, menu items, orders, and staff.
authRouter.delete("/me", requireAuth, asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const appUser = await User.findById(req.user._id);
  if (!appUser) {
    throw new ApiError(404, "User not found");
  }

  // Delete from Clerk first. If this fails, keep local data so the account is not half-deleted.
  await deleteClerkUserForAppUser(appUser);
  
  if (appUser.role === "owner" && restaurantId) {
    // 1. Delete all Menu Items
    await MenuItem.deleteMany({ restaurantId });
    // 2. Delete all Orders
    await Order.deleteMany({ restaurantId });
    // 3. Delete the Restaurant
    await Restaurant.findByIdAndDelete(restaurantId);
    // 4. Delete all Staff/Employees for this restaurant
    await User.deleteMany({ restaurantId, role: "employee" });
    await Staff.deleteMany({ restaurantId });
  }

  if (appUser.role === "customer") {
    await Order.deleteMany({ customerId: appUser._id });
  }

  // Delete the app user
  await User.findByIdAndDelete(req.user._id);

  clearAuthCookie(req, res);
  res.json({ message: "Account and all associated data permanently deleted" });
}));
