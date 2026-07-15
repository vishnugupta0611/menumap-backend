import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { User } from "../models/User.js";
import { Staff } from "../models/Staff.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

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
  restaurantName: z.string().min(2).max(100),
  city: z.string().min(2).max(50).transform((val) => val.toLowerCase()),
  cuisine: z.string().optional(),
  lat: requiredCoordinate,
  lng: requiredCoordinate,
});

const registerCustomerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  clerkId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const employeeLoginSchema = z.object({
  username: z.string().trim().min(2),
  password: z.string(),
});

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
    throw new ApiError(409, "Email already registered");
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

  // Create user with restaurantId
  const user = await User.create(userPayload);

  // Update restaurant with ownerId
  restaurant.ownerId = user._id;
  await restaurant.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Set httpOnly cookie
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

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
    throw new ApiError(409, "Email already registered");
  }

  const userPayload = {
    name: validated.name,
    email: validated.email,
    role: "customer",
  };
  if (validated.password) userPayload.password = validated.password;
  if (validated.clerkId) userPayload.clerkId = validated.clerkId;

  // Create user
  const user = await User.create(userPayload);

  // Generate JWT token
  const token = user.generateAuthToken();

  // Set httpOnly cookie
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

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

  if (user.role !== validated.role) {
    const correctPortal = user.role === "owner" ? "Restaurant Owner" : "Discovery User";
    throw new ApiError(403, `This email belongs to a ${user.role} account. Please use the ${correctPortal} login tab.`);
  } else if (!user.clerkId && validated.clerkId) {
    user.clerkId = validated.clerkId;
    await user.save();
  }

  const token = user.generateAuthToken();
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
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
  });
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

  // Set httpOnly cookie
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Prepare response
  const response = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token");
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
// Hard deletes the user, their restaurant, all menu items, and all associated employee accounts.
authRouter.delete("/me", requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== "owner") {
    throw new ApiError(403, "Only restaurant owners can delete their accounts");
  }

  const restaurantId = req.user.restaurantId;
  
  if (restaurantId) {
    // 1. Delete all Menu Items
    await MenuItem.deleteMany({ restaurantId });
    // 2. Delete the Restaurant
    await Restaurant.findByIdAndDelete(restaurantId);
    // 3. Delete all Staff/Employees for this restaurant
    await User.deleteMany({ restaurantId, role: "employee" });
    await Staff.deleteMany({ restaurantId });
  }

  // 4. Delete the Owner User
  await User.findByIdAndDelete(req.user._id);

  res.clearCookie("token");
  res.json({ message: "Account and all associated data permanently deleted" });
}));
