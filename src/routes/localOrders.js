import { Router } from "express";
import { z } from "zod";
import { LocalOrder } from "../models/LocalOrder.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const localOrdersRouter = Router();

localOrdersRouter.use(requireAuth, requireRole(["owner", "employee"]));

const orderEntrySchema = z.object({
  qty: z.number().int().positive(),
  price: z.number().nonnegative(),
  status: z.enum(["pending", "served"]).default("served"),
});

const syncItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  orders: z.array(orderEntrySchema).min(1),
});

const syncBatchSchema = z.object({
  items: z.array(syncItemSchema).min(1),
});

// GET /api/local-orders?date=YYYY-MM-DD
// Returns all item documents for a given date
localOrdersRouter.get("/", asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new ApiError(400, "date is required");

  const docs = await LocalOrder.find({ restaurantId: req.user.restaurantId, date }).sort({ updatedAt: -1 });
  res.json({ data: docs });
}));

// GET /api/local-orders/history?startDate=&endDate=
// Returns all docs in a date range for history/reporting
localOrdersRouter.get("/history", asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) throw new ApiError(400, "startDate and endDate are required");

  const docs = await LocalOrder.find({
    restaurantId: req.user.restaurantId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1, itemName: 1 });

  res.json({ data: docs });
}));

// POST /api/local-orders/sync
// Batch upsert: for each item, find-or-create the day's doc and push orders
localOrdersRouter.post("/sync", validate(syncBatchSchema), asyncHandler(async (req, res) => {
  const { items } = req.body;
  const restaurantId = req.user.restaurantId;

  const results = await Promise.all(
    items.map(({ date, itemId, itemName, orders }) =>
      LocalOrder.findOneAndUpdate(
        { restaurantId, date, itemId },
        {
          $setOnInsert: { itemName },
          $push: { orders: { $each: orders } },
        },
        { upsert: true, new: true }
      )
    )
  );

  res.json({ success: true, data: results });
}));

// PATCH /api/local-orders/:docId/orders/:orderId
// Update a single order entry (qty, price, status)
localOrdersRouter.patch("/:docId/orders/:orderId", asyncHandler(async (req, res) => {
  const { docId, orderId } = req.params;
  const { qty, price, status } = req.body;

  const updateFields = {};
  if (qty !== undefined) updateFields["orders.$.qty"] = qty;
  if (price !== undefined) updateFields["orders.$.price"] = price;
  if (status !== undefined) updateFields["orders.$.status"] = status;

  const doc = await LocalOrder.findOneAndUpdate(
    { _id: docId, restaurantId: req.user.restaurantId, "orders._id": orderId },
    { $set: updateFields },
    { new: true }
  );

  if (!doc) throw new ApiError(404, "Order not found");
  res.json({ success: true, data: doc });
}));

// DELETE /api/local-orders/:docId/orders/:orderId
// Delete a single order entry; if last order, delete the whole doc
localOrdersRouter.delete("/:docId/orders/:orderId", asyncHandler(async (req, res) => {
  const { docId, orderId } = req.params;

  const doc = await LocalOrder.findOneAndUpdate(
    { _id: docId, restaurantId: req.user.restaurantId },
    { $pull: { orders: { _id: orderId } } },
    { new: true }
  );

  if (!doc) throw new ApiError(404, "Document not found");

  // If no orders left, remove the whole document
  if (doc.orders.length === 0) {
    await LocalOrder.deleteOne({ _id: docId });
  }

  res.json({ success: true });
}));

// DELETE /api/local-orders/:docId
// Delete an entire item doc for a day
localOrdersRouter.delete("/:docId", asyncHandler(async (req, res) => {
  const { docId } = req.params;
  const deleted = await LocalOrder.findOneAndDelete({ _id: docId, restaurantId: req.user.restaurantId });
  if (!deleted) throw new ApiError(404, "Document not found");
  res.json({ success: true });
}));
