import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ["Owner", "Admin", "Manager", "Chef", "Waiter"], default: "Waiter" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    avatar: { type: String },
    permissions: { type: String },
    email: { type: String },
    clerkId: { type: String },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  },
  { timestamps: true }
);

export const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
