import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
        name: { type: String }, // For history snapshot
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Preparing", "Ready", "Completed", "Cancelled"],
      default: "Pending",
    },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    tableNumber: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
