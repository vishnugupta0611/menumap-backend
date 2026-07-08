import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    veg: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    category: { type: String }, // Backwards compatibility helper
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuItemSchema.index({ restaurantId: 1, categoryId: 1 });
MenuItemSchema.index({ name: "text", description: "text", category: "text" });

export const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
