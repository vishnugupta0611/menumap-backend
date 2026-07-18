import { Router } from "express";
import { z } from "zod";
import { Order } from "../models/Order.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { validate } from "../middleware/validate.js";
import { paginated } from "../utils/pagination.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth.js";

const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().trim().max(120).optional(),
  customerEmail: z.string().trim().email().optional(),
  customerPhone: z.string().trim().optional(),
  tableNumber: z.string().trim().max(40).optional(),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    name: z.string().trim().min(1),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })).min(1),
});

const statusSchema = z.object({
  status: z.enum(["Pending", "Accepted", "Preparing", "Ready", "Completed", "Cancelled"]),
});

export function createOrdersRouter(io) {
  const router = Router();

  router.get("/", requireAuth, requireRole(["owner", "employee"]), asyncHandler(async (req, res) => {
    const filter = { restaurantId: req.user.restaurantId };
    if (req.query.status) filter.status = req.query.status;
    
    console.log("GET /api/orders - User role:", req.user.role, "RestaurantId:", req.user.restaurantId, "Filter:", filter);

    const result = await paginated(
      Order.find(filter).sort({ createdAt: -1 }),
      Order.countDocuments(filter),
      req.query
    );
    res.json(result);
  }));

  router.get("/customer", asyncHandler(async (req, res) => {
    if (!req.query.email) throw new ApiError(400, "Email is required");
    const filter = { customerEmail: req.query.email };
    const result = await paginated(
      Order.find(filter).sort({ createdAt: -1 }).populate("restaurantId", "name city slug"),
      Order.countDocuments(filter),
      req.query
    );
    res.json(result);
  }));

  router.post("/", optionalAuth, validate(createOrderSchema), asyncHandler(async (req, res) => {
    // Owners and employees can now place orders (POS)


    const totalAmount = req.body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderData = { ...req.body, totalAmount };
    if (req.user) {
      orderData.customerId = req.user._id;
    }
    const order = await Order.create(orderData);
    io.to(order.restaurantId.toString()).emit("orders:new", order);
    res.status(201).json({ data: order });
  }));

  router.get("/my-orders", requireAuth, asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") {
      throw new ApiError(403, "Only customers can view customer order history");
    }

    const filter = { customerId: req.user._id };
    const result = await paginated(
      Order.find(filter).sort({ createdAt: -1 }).populate("restaurantId", "name city slug logoImage"),
      Order.countDocuments(filter),
      req.query
    );
    res.json(result);
  }));

  router.patch("/:id/status", requireAuth, requireRole(["owner", "employee"]), validate(statusSchema), asyncHandler(async (req, res) => {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { status: req.body.status },
      { new: true }
    );
    if (!order) throw new ApiError(404, "Order not found");
    io.to(String(order.restaurantId)).emit("orders:status", order);
    res.json({ data: order });
  }));

  return router;
}
