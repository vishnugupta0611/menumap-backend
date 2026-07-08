import mongoose from "mongoose";

const GalleryAssetSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    url: { type: String, required: true },
    alt: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GalleryAsset = mongoose.models.GalleryAsset || mongoose.model("GalleryAsset", GalleryAssetSchema);
