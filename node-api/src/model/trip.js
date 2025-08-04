// import mongoose from "mongoose";
// import { Driver } from "./driver.js";
// import { Camion } from "./camion.js";

// export const tripSchema = new mongoose.Schema(
//   {
//     truck: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Camion",
//       required: true,
//       validate: {
//         validator: async function (truckId) {
//           const truck = await Camion.findById(truckId);
//           return truck && truck.status === "in_service";
//         },
//         message: "Le camion doit être en service.",
//       },
//     },
//     driver: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Driver",
//       required: true,
//       validate: {
//         validator: async function (driverId) {
//           const driver = await Driver.findById(driverId);
//           return driver && driver.status === "available";
//         },
//         message: "Le chauffeur doit être disponible.",
//       },
//     },
//     startPoint: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     destination: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     departureDate: {
//       type: Date,
//       required: true,
//     },
//     departureTime: {
//       type: String,
//       required: true,
//       validate: {
//         validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
//         message: "Format de l'heure invalide. Utilisez HH:mm",
//       },
//       },
//     statusTrip: {
//       type: String,
//       enum: ["pending","in_progress", "completed", "active"],
//       default: "active",
//     },
//     distance: {
//   type: Number, // en kilomètres
//   min: 0
// },
//     requestedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//       }

//   },
  
//   {
//     timestamps: true,
//   }
// );

// export const Trip = mongoose.model("Trip", tripSchema);

import mongoose from "mongoose";
import { Driver } from "./driver.js";
import { Camion } from "./camion.js";

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
}, { _id: false });

const routePointSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
}, { _id: false });

export const tripSchema = new mongoose.Schema(
  {
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camion",
      required: true,
      validate: {
        validator: async function (truckId) {
          const truck = await Camion.findById(truckId);
          return truck && truck.status === "in_service";
        },
        message: "Le camion doit être en service.",
      },
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      validate: {
        validator: async function (driverId) {
          const driver = await Driver.findById(driverId);
          return driver && driver.status === "available";
        },
        message: "Le chauffeur doit être disponible.",
      },
    },
    startPoint: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,

    },
    departureDate: {
      type: Date,
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
      validate: {
        validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
        message: "Format de l'heure invalide. Utilisez HH:mm",
      },
    },
    statusTrip: {
      type: String,
      enum: ["pending", "in_progress", "completed", "active"],
      default: "active",
    },
    distance: {
      type: Number,
      min: 0,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Real-time fields
    currentLocation: {
      type: locationSchema,
      default: null,
    },

    route: {
      type: [routePointSchema],
      default: [],
    },

    routeProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pour mettre à jour lastUpdate à chaque sauvegarde
tripSchema.pre('save', function (next) {
  this.lastUpdate = new Date();

  if (this.routeProgress >= 100 || this.isCompleted) {
    this.statusTrip = "completed";
    this.isCompleted = true;
  } else if (this.routeProgress > 0) {
    this.statusTrip = "in_progress";
    this.isCompleted = false;
  } else {
    this.statusTrip = "pending";
    this.isCompleted = false;
  }

  next();
});

export const Trip = mongoose.model("Trip", tripSchema);
