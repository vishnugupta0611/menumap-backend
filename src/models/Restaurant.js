import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    cuisine: { type: String },
    rating: { type: Number, default: 4.5 },
    reviewsCount: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 1.0 },
    priceForTwo: { type: Number, default: 500 },
    openNow: { type: Boolean, default: true },
    address: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    website: { type: String },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      x: { type: String },
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    heroImage: { type: String },
    logoImage: { type: String },
    qrCodeUrl: { type: String },
    facilities: [{ type: String }],
    story: { type: String },
    history: { type: String },
    timings: { type: Map, of: String },
    holidays: [{ type: String }],
    menuUiSettings: {
      colorPalette: { type: String, default: "clay" },
      font: { type: String, default: "jakarta" },
      layout: { type: String, default: "simple-list" },
      showBanner: { type: Boolean, default: false },
      showDescription: { type: Boolean, default: false },
      showBadges: { type: Boolean, default: true },
      showImage: { type: Boolean, default: true },
      showTabs: { type: Boolean, default: false },
      heroImageLayout: { type: String, default: "rounded" },
      galleryLayout: { type: String, default: "unlimited" },
      qrCharacter: { type: String, default: "img1" },
      featuredGalleryIds: [{ type: String }],
      allowGuestOrders: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

RestaurantSchema.index({ city: 1, slug: 1 }, { unique: true });
RestaurantSchema.index({ name: "text", cuisine: "text", city: "text" });

export const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", RestaurantSchema);
