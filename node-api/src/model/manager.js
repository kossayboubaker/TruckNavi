import mongoose from "mongoose";
import { User } from "./user.js";


const managerSchema = new mongoose.Schema({
  Post: {
    type: String,
    enum: ["Fleet Manager", "Operations Manager", "Logistics Manager", "Other"],
    
  },
});

export const Manager = User.discriminator("Manager", managerSchema);
