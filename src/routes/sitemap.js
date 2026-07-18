// src/routes/sitemap.js
// Lightweight endpoints used by the Next.js sitemap system.
// Only selects the fields needed — no heavy population.

import { Router } from "express";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/async-handler.js";

export const sitemapRouter = Router();

// GET /api/sitemap/count
// Returns total restaurant count for sitemap index chunk calculation.
sitemapRouter.get("/count", asyncHandler(async (_req, res) => {
  const count = await Restaurant.countDocuments({});
  res.json({ count });
}));

// GET /api/sitemap/restaurants?page=1&limit=500
// Returns paginated restaurant slugs for sitemap generation.
// Only fetches city, slug, updatedAt — minimal payload.
sitemapRouter.get("/restaurants", asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 500));
  const skip = (page - 1) * limit;

  const restaurants = await Restaurant
    .find({}, "city slug updatedAt")
    .sort({ _id: 1 }) // stable sort for consistent pagination
    .skip(skip)
    .limit(limit)
    .lean(); // plain JS objects — faster, less memory

  res.json({ restaurants });
}));

// GET /api/sitemap/cities
// Returns unique city slugs for city landing pages.
sitemapRouter.get("/cities", asyncHandler(async (_req, res) => {
  const cities = await Restaurant.distinct("city");
  res.json({ cities: cities.filter(Boolean).map(c => c.toLowerCase()) });
}));
