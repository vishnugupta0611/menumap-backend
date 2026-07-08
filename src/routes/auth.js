import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

// Validation schemas
const registerOwnerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
  cuisine: z.string().optional(),
});

const registerCustomerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
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
  });

  // Create user with restaurantId
  const user = await User.create({
    name: validated.name,
    email: validated.email,
    password: validated.password, // Will be hashed by pre-save hook
    role: "owner",
    restaurantId: restaurant._id,
  });

  // Update restaurant with ownerId
  restaurant.ownerId = user._id;
  await restaurant.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Set httpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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

  // Create user
  const user = await User.create({
    name: validated.name,
    email: validated.email,
    password: validated.password, // Will be hashed by pre-save hook
    role: "customer",
  });

  // Generate JWT token
  const token = user.generateAuthToken();

  // Set httpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
    throw new ApiError(401, "Invalid email or password");
  }

  // Check password
  const isMatch = await user.comparePassword(validated.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  // Set httpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
    },
  };

  // If owner, include restaurant data
  if (req.user.role === "owner" && req.user.restaurantId) {
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
