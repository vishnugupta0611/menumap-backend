import mongoose from "mongoose";

const transactionItemSchema = {
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
};

const LocalLedgerSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    
    // Individual paid transactions (NOT aggregated - each order is a separate row)
    paidItems: [transactionItemSchema],

    // Individual pending items (unpaid / udhaar)
    pendingItems: [transactionItemSchema],
  },
  { timestamps: true }
);

LocalLedgerSchema.index({ restaurantId: 1, date: 1 }, { unique: true });

export const LocalLedger = mongoose.models.LocalLedger || mongoose.model("LocalLedger", LocalLedgerSchema);
