import { Router } from "express";
import { z } from "zod";
import slugify from "slugify";
import { Restaurant } from "../models/Restaurant.js";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";
import { Review } from "../models/Review.js";
import { Staff } from "../models/Staff.js";
import { GalleryAsset } from "../models/GalleryAsset.js";
import { Offer } from "../models/Offer.js";
import { Order } from "../models/Order.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { validate } from "../middleware/validate.js";
import { paginated } from "../utils/pagination.js";

export const restaurantsRouter = Router();

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const restaurantSchema = z.object({
  name: z.string().trim().min(2),
  city: z.string().trim().min(2).transform((value) => value.toLowerCase()),
  slug: z.string().trim().min(2).optional(),
  cuisine: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  website: z.union([z.string().trim().url(), z.literal("")]).optional(),
  heroImage: z.union([z.string().trim().url(), z.literal("")]).optional(),
  logoImage: z.union([z.string().trim().url(), z.literal("")]).optional(),
  qrCodeUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
  facilities: z.array(z.string()).optional(),
  story: z.string().trim().optional(),
  openNow: z.boolean().optional(),
  priceForTwo: z.number().nonnegative().optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    x: z.string().optional(),
  }).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  menuUiSettings: z.object({
    colorPalette: z.string().optional(),
    font: z.string().optional(),
    layout: z.string().optional(),
    showBanner: z.boolean().optional(),
    showDescription: z.boolean().optional(),
    showBadges: z.boolean().optional(),
    showImage: z.boolean().optional(),
    showTabs: z.boolean().optional(),
    heroImageLayout: z.string().optional(),
    galleryLayout: z.string().optional(),
    qrCharacter: z.string().optional(),
    featuredGalleryIds: z.array(z.string()).optional(),
    allowGuestOrders: z.boolean().optional(),
  }).optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(2),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

const menuItemSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  price: z.number().nonnegative(),
  image: z.string().trim().optional(),
  veg: z.boolean().default(true),
  popular: z.boolean().default(false),
  categoryId: objectId.optional(),
  category: z.string().trim().optional(),
  available: z.boolean().default(true),
});

const reviewSchema = z.object({
  name: z.string().trim().min(2),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(4),
});

const staffSchema = z.object({
  name: z.string().trim().min(2),
  username: z.string().trim().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["Owner", "Admin", "Manager", "Chef", "Waiter"]).default("Waiter"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  avatar: z.string().trim().url().optional(),
  permissions: z.array(z.string()).optional(),
  email: z.string().trim().email().optional(),
  clerkId: z.string().trim().optional(),
});

const gallerySchema = z.object({
  url: z.string().trim().url(),
  alt: z.string().trim().min(2),
  sortOrder: z.number().int().default(0),
});

const offerSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  code: z.string().trim().optional(),
  active: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

async function findRestaurantByPublicParams(req) {
  const restaurant = await Restaurant.findOne({
    city: { $regex: new RegExp(`^${req.params.city}$`, 'i') },
    slug: { $regex: new RegExp(`^${req.params.slug}$`, 'i') },
  }).lean();
  if (!restaurant) throw new ApiError(404, "Restaurant not found");
  return { ...restaurant, id: restaurant._id };
}

restaurantsRouter.get("/", asyncHandler(async (req, res) => {
  const filter = {};
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (req.query.city) filter.city = { $regex: new RegExp(`^${escapeRegex(req.query.city)}$`, 'i') };
  if (req.query.openNow === "true") filter.openNow = true;
  if (req.query.q) filter.$text = { $search: String(req.query.q) };

  const result = await paginated(
    Restaurant.find(filter)
      .select("name slug city cuisine rating heroImage logoImage distanceKm priceForTwo openNow address location")
      .sort({ rating: -1, name: 1 }),
    Restaurant.countDocuments(filter),
    req.query
  );
  if (!isNaN(lat) && !isNaN(lng)) {
    result.data = result.data
      .map((restaurant) => {
        const item = restaurant.toObject ? restaurant.toObject() : restaurant;
        if (item.location?.lat && item.location?.lng) {
          item.distanceKm = getDistance(lat, lng, item.location.lat, item.location.lng);
        }
        return item;
      })
      .sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
  }
  res.json(result);
}));

restaurantsRouter.post("/", validate(restaurantSchema), asyncHandler(async (req, res) => {
  const slug = req.body.slug || slugify(req.body.name, { lower: true, strict: true });
  const restaurant = await Restaurant.create({ ...req.body, slug });
  res.status(201).json({ data: restaurant });
}));

restaurantsRouter.get("/id/:id", asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new ApiError(404, "Restaurant not found");
  res.json({ data: restaurant });
}));

restaurantsRouter.patch("/id/:id", validate(restaurantSchema.partial()), asyncHandler(async (req, res) => {
  const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Restaurant not found");
  res.json({ data: updated });
}));

restaurantsRouter.get("/id/:id/stats", asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    restaurantId: req.params.id,
    createdAt: { $gte: today }
  });

  const totalOrders = orders.length;
  const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const menuItemsCount = await MenuItem.countDocuments({ restaurantId: req.params.id });

  res.json({
    data: {
      ordersToday: totalOrders,
      revenueToday: revenue,
      menuItemsCount: menuItemsCount,
      qrScans: 314 // Mocked for now
    }
  });
}));

restaurantsRouter.get("/id/:id/categories", asyncHandler(async (req, res) => {
  const list = await Category.find({ restaurantId: req.params.id }).sort({ sortOrder: 1 });
  res.json({ data: list });
}));

restaurantsRouter.post("/id/:id/categories", validate(categorySchema), asyncHandler(async (req, res) => {
  const created = await Category.create({ ...req.body, restaurantId: req.params.id });
  res.status(201).json({ data: created });
}));

restaurantsRouter.patch("/categories/:catId", validate(categorySchema.partial()), asyncHandler(async (req, res) => {
  const updated = await Category.findByIdAndUpdate(req.params.catId, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Category not found");
  res.json({ data: updated });
}));

restaurantsRouter.delete("/categories/:catId", asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.catId);
  res.status(204).send();
}));

restaurantsRouter.get("/id/:id/menu-items", asyncHandler(async (req, res) => {
  const list = await MenuItem.find({ restaurantId: req.params.id }).sort({ category: 1, name: 1 });
  res.json({ data: list });
}));

restaurantsRouter.post("/id/:id/menu-items", validate(menuItemSchema), asyncHandler(async (req, res) => {
  const created = await MenuItem.create({ ...req.body, restaurantId: req.params.id });
  res.status(201).json({ data: created });
}));

restaurantsRouter.patch("/menu-items/:itemId", validate(menuItemSchema.partial()), asyncHandler(async (req, res) => {
  const updated = await MenuItem.findByIdAndUpdate(req.params.itemId, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Menu item not found");
  res.json({ data: updated });
}));

restaurantsRouter.delete("/menu-items/:itemId", asyncHandler(async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.itemId);
  res.status(204).send();
}));

restaurantsRouter.get("/id/:id/staff", asyncHandler(async (req, res) => {
  const list = await Staff.find({ restaurantId: req.params.id }).sort({ role: 1, name: 1 });
  res.json({ data: list });
}));

restaurantsRouter.post("/id/:id/staff", validate(staffSchema), asyncHandler(async (req, res) => {
  const created = await Staff.create({ ...req.body, restaurantId: req.params.id });
  res.status(201).json({ data: created });
}));

restaurantsRouter.patch("/staff/:staffId", validate(staffSchema.partial()), asyncHandler(async (req, res) => {
  const updated = await Staff.findByIdAndUpdate(req.params.staffId, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Staff member not found");
  res.json({ data: updated });
}));

restaurantsRouter.delete("/staff/:staffId", asyncHandler(async (req, res) => {
  await Staff.findByIdAndDelete(req.params.staffId);
  res.status(204).send();
}));

restaurantsRouter.get("/id/:id/gallery", asyncHandler(async (req, res) => {
  const list = await GalleryAsset.find({ restaurantId: req.params.id }).sort({ sortOrder: 1 });
  res.json({ data: list });
}));

restaurantsRouter.post("/id/:id/gallery", validate(gallerySchema), asyncHandler(async (req, res) => {
  const created = await GalleryAsset.create({ ...req.body, restaurantId: req.params.id });
  res.status(201).json({ data: created });
}));

restaurantsRouter.get("/id/:id/offers", asyncHandler(async (req, res) => {
  const list = await Offer.find({ restaurantId: req.params.id }).sort({ createdAt: -1 });
  res.json({ data: list });
}));

restaurantsRouter.post("/id/:id/offers", validate(offerSchema), asyncHandler(async (req, res) => {
  const created = await Offer.create({ ...req.body, restaurantId: req.params.id });
  res.status(201).json({ data: created });
}));

restaurantsRouter.get("/:city/:slug", asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantByPublicParams(req);
  res.json({ data: restaurant });
}));

restaurantsRouter.get("/:city/:slug/menu", asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantByPublicParams(req);
  const menu = await MenuItem.find({ restaurantId: restaurant._id, available: true }).sort({ category: 1, name: 1 }).lean();
  res.json({ data: menu.map(m => ({ ...m, id: m._id })) });
}));

restaurantsRouter.get("/:city/:slug/reviews", asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantByPublicParams(req);
  const reviews = await Review.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).lean();
  res.json({ data: reviews.map(r => ({ ...r, id: r._id })) });
}));

restaurantsRouter.get("/:city/:slug/gallery", asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantByPublicParams(req);
  const gallery = await GalleryAsset.find({ restaurantId: restaurant._id }).sort({ sortOrder: 1 }).lean();
  res.json({ data: gallery.map(g => ({ ...g, id: g._id })) });
}));

restaurantsRouter.get("/:city/:slug/offers", asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantByPublicParams(req);
  const now = new Date();
  
  // Find all active offers that haven't expired yet
  const offers = await Offer.find({ 
    restaurantId: restaurant._id,
    active: true,
    $or: [
      { endsAt: { $exists: false } },
      { endsAt: null },
      { endsAt: { $gt: now } }
    ]
  }).sort({ createdAt: -1 }).lean();
  
  res.json({ data: offers.map(o => ({ ...o, id: o._id })) });
}));

restaurantsRouter.post("/:city/:slug/reviews", validate(reviewSchema), asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantByPublicParams(req);
  const review = await Review.create({ ...req.body, restaurantId: restaurant._id });
  res.status(201).json({ data: review });
}));

// Get all reviews for a restaurant by ID
restaurantsRouter.get("/id/:id/reviews", asyncHandler(async (req, res) => {
  const list = await Review.find({ restaurantId: req.params.id }).sort({ createdAt: -1 });
  res.json({ data: list });
}));

// Delete review
restaurantsRouter.delete("/reviews/:reviewId", asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.reviewId);
  res.status(204).send();
}));

// Delete gallery asset
restaurantsRouter.delete("/gallery/:assetId", asyncHandler(async (req, res) => {
  await GalleryAsset.findByIdAndDelete(req.params.assetId);
  res.status(204).send();
}));

// Update gallery asset (sortOrder etc)
restaurantsRouter.patch("/gallery/:assetId", validate(gallerySchema.partial()), asyncHandler(async (req, res) => {
  const updated = await GalleryAsset.findByIdAndUpdate(req.params.assetId, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Gallery asset not found");
  res.json({ data: updated });
}));

// Edit offer
restaurantsRouter.patch("/offers/:offerId", validate(offerSchema.partial()), asyncHandler(async (req, res) => {
  const updated = await Offer.findByIdAndUpdate(req.params.offerId, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Offer not found");
  res.json({ data: updated });
}));

// Delete offer
restaurantsRouter.delete("/offers/:offerId", asyncHandler(async (req, res) => {
  await Offer.findByIdAndDelete(req.params.offerId);
  res.status(204).send();
}));
