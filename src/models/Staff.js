import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const StaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ["Owner", "Admin", "Manager", "Chef", "Waiter"], default: "Waiter" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    avatar: { type: String },
    permissions: [{ type: String }],
    email: { type: String },
    clerkId: { type: String },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  },
  { timestamps: true }
);

// Hash password before saving
StaffSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
StaffSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Method to generate JWT token (flagged as employee)
StaffSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { userId: this._id, role: this.role.toLowerCase(), isEmployee: true, restaurantId: this.restaurantId },
    process.env.JWT_SECRET || "dev-secret-key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
