import { Router } from "express";
import QRCode from "qrcode";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

export const qrRouter = Router();

qrRouter.get("/restaurants/:id", asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new ApiError(404, "Restaurant not found");

  const baseUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/${restaurant.city}/${restaurant.slug}/menu`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 512 });
  res.json({ data: { url, dataUrl } });
}));
