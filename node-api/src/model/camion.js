import mongoose from "mongoose";

export const truckSchema = new mongoose.Schema({
  truckId: { type: String, required: true, unique: true, trim: true },
  truckType: { type: String, enum: ['Tanker', 'Flatbed', 'Refrigerated', 'Box', 'Other'], required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  length: { type: Number, required: true },
  axleCount: { type: Number, required: true },
  fuelType: { type: String, enum: ['Diesel', 'Petrol', 'Electric', 'Hybrid'], required: true },
  fuelConsumption: { type: Number },
  emissionRate: { type: Number },
  ecoMode: { type: Boolean, default: false },
  hazardousCargo: { type: Boolean, default: false },
  maxAllowedSpeed: { type: Number, default: 80 },
  status: { type: String, enum: ["in_service", "out_of_service", "under_maintenance"], default: "out_of_service" },
  location: {
    type: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true }
    },
    index: '2dsphere' // For geospatial queries
  },
  speed: { type: Number, default: 0 },
  bearing: { type: Number, default: 0 },
  destination: {
  type: String,
  trim: true,
}
,
  route: [{
    longitude: Number,
    latitude: Number
  }],
  routeProgress: { type: Number, default: 0 },
  fuelLevel: { type: Number, default: 0 },
  engineTemp: { type: Number, default: 0 },
  isAtDestination: { type: Boolean, default: false },
  lastUpdate: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const Camion = mongoose.model("Camion", truckSchema);

// import mongoose from "mongoose";

// export const truckSchema = new mongoose.Schema(
//   {
//     brand: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     capacity: {
//       type: Number, // en tonnes ou kg selon ton besoin
//       required: true,
//       min: 0,
//     },
//         consumption:{type:Number,default:0},

//     mileage: {
//       type: Number, // en kilomètres
//       required: true,
//       min: 0,
//     },
//     status: {
//       type: String,
//       enum: ["in_service", "out_of_service", "under_maintenance"],
//       default: "out_of_service",
//     },
//     registration: {
//       type: String,
//       required: true,
//       unique: true,
//       uppercase: true,
//       trim: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// export const Camion = mongoose.model("Camion", truckSchema);

