import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    code: { type: String },
    active: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

export const Offer = mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
