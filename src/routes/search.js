import { Router } from "express";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/async-handler.js";

export const searchRouter = Router();

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

searchRouter.get("/dishes", asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  const maxPrice = Number(req.query.maxPrice) || undefined;
  const veg = req.query.veg === "true" ? true : undefined;
  const openNow = req.query.openNow === "true";
  const nearby = req.query.nearby === "true";
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const city = req.query.city ? String(req.query.city) : undefined;
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 60);
  const skip = (page - 1) * limit;

  const restFilter = openNow ? { openNow: true } : {};
  if (city) {
    // Case insensitive match
    restFilter.city = { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') };
  }

  const restaurants = await Restaurant.find(restFilter)
    .select("name slug city cuisine rating heroImage logoImage distanceKm priceForTwo openNow address location");
  
  const restaurantById = new Map();
  restaurants.forEach(r => {
    const rObj = r.toObject();
    if (!isNaN(lat) && !isNaN(lng) && r.location?.lat && r.location?.lng) {
      rObj.distanceKm = getDistance(lat, lng, r.location.lat, r.location.lng);
    } else {
      rObj.distanceKm = null; // Overwrite any fake mock data in the DB if no GPS coordinates exist
    }
    restaurantById.set(String(r._id), rObj);
  });
  
  let restaurantIds = restaurants.map(r => String(r._id));

  const filter = { restaurantId: { $in: restaurantIds }, available: true };
  if (query) filter.$text = { $search: query };
  if (typeof veg === "boolean") filter.veg = veg;
  if (maxPrice) filter.price = { $lte: maxPrice };

  const total = await MenuItem.countDocuments(filter);

  let dishes = await MenuItem.find(filter)
    .sort(query ? { score: { $meta: "textScore" } } : { rating: -1 })
    .skip(skip)
    .limit(limit);
  
  let mappedDishes = dishes.map((dish) => ({
    ...dish.toObject(),
    restaurant: restaurantById.get(String(dish.restaurantId)),
  }));

  if (nearby && !isNaN(lat) && !isNaN(lng)) {
    // sort ascending by distance
    mappedDishes.sort((a, b) => (a.restaurant?.distanceKm || 999) - (b.restaurant?.distanceKm || 999));
  }

  res.json({
    data: mappedDishes,
    hasMore: total > skip + mappedDishes.length,
    total
  });
}));
