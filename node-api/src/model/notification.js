// models/Notification.js
import mongoose from "mongoose";

export const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // ou "Driver" ou autre selon ton système
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optionnel, pour tracer l’émetteur (admin, manager...)
    },
    type: {
      type: String,
      enum: [
        "account_validation",
        "driver_assignment",
        "leave_request",
        "leave_response",
        "complaint",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },

    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "entityType", // référence dynamique
    },
   entityType: {
      type: String,
      enum: ["User", "Trajet", "Leave", "Complaint","Message"],
    },

 seen: {
  type: Boolean,
  default: false,
},
    token: { type: String }, // dans notificationSchema

    //  metadata: {
    //   type: mongoose.Schema.Types.Mixed, // permet de stocker un objet quelconque
    //   default: {},
    // },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
