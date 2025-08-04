import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  FirstName: { type: String,  },
  LastName: { type: String,  },
  email_user: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["super_admin", "manager", "driver"], required: true },
  num_user: { type: Number },
  country: { type: String },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false }, // ✅ Obligé de changer mot de passe
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }, // 🔄 Optionnel : lien entreprise
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  // Ces trois champs doivent être définis séparément :
  refreshToken: { type: String, default: null },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }

}

);
export const User = mongoose.model("User", userSchema);
 