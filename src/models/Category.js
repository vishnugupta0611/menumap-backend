import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ restaurantId: 1, sortOrder: 1 });

export const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
