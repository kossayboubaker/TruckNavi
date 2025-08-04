import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  email_user: { required: true, type: String },
  token: { required: true, type: String },
  created_at: { type: Date, default: Date.now }
});

passwordResetSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

passwordResetSchema.set("toJSON", { virtuals: true });

export const passwordResetModel = mongoose.model("PasswordReset", passwordResetSchema);
