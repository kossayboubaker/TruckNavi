import mongoose from "mongoose";
import { User } from "./user.js";

const driverSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["available", "on_route", "off_duty"],
    default: "available"
  }, createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 🔹 référence au manager
    required: false,
  },
  
});

export const Driver = User.discriminator("Driver", driverSchema);
