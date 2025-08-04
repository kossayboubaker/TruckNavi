import mongoose from "mongoose";

export const congeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // utilisateur demandeur
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    typeConge: {
      type: String,
      enum: ["maladie", "mariage", "vacance", "autre"],
      required: true,
    },
    periode: {
      type: String,
      default: "jour",
    },
    reason: {
      type: String,
      maxlength: 500,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // utilisateur manager validateur
    },
    justificatif: {
      type: String, // chemin ou URL du fichier justificatif (PDF, image, etc.)
    },
    commentaire: {
      type: String, // commentaire en cas de refus
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // createdAt et updatedAt
  }
);

export const Conge = mongoose.model("Conge", congeSchema);
