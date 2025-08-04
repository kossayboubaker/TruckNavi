import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  company_name: { type: String, required: true, trim: true },
  campany_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  code_tva: { type: Number, required: true, trim: true },
  Campany_adress: { type: String, required: true, trim: true },
  num_campany: { type: Number, required: true },
  representant_legal: { type: String, required: true, trim: true },
  image_campany: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
export const Company = mongoose.model("Company", companySchema);
