import mongoose from "mongoose";

const orderEntrySchema = new mongoose.Schema(
  {
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "served"], default: "served" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const LocalOrderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    itemId: { type: String, required: true }, // slug e.g. "paneer-tikka" or menuItemId
    itemName: { type: String, required: true },
    orders: [orderEntrySchema],
  },
  { timestamps: true }
);

// One document per restaurant per date per item
LocalOrderSchema.index({ restaurantId: 1, date: 1, itemId: 1 }, { unique: true });

export const LocalOrder = mongoose.models.LocalOrder || mongoose.model("LocalOrder", LocalOrderSchema);
