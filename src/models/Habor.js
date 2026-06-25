import mongoose from "mongoose";

const harborSchema = new mongoose.Schema(
  {
    // Core Information
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
      // Examples:
      // USLAX - Los Angeles
      // GHTKD - Takoradi
    },

    harborType: {
      type: String,
      enum: [
        "seaport",
        "riverport",
        "dryport",
        "airport",
        "multimodal",
      ],
      default: "seaport",
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    // Location
    continent: {
      type: String,
      required: true,
      index: true,
    },

    country: {
      type: String,
      required: true,
      index: true,
    },

    city: {
      type: String,
      required: true,
      index: true,
    },

    address: String,

    timezone: {
      type: String,
      default: "UTC",
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (v) => v.length === 2,
          message: "Coordinates must contain longitude and latitude",
        },
      },
    },

    // Operations
    operationalStatus: {
      type: String,
      enum: [
        "active",
        "restricted",
        "maintenance",
        "closed",
      ],
      default: "active",
    },

    capacityStatus: {
      type: String,
      enum: [
        "optimal",
        "busy",
        "congested",
        "critical",
        "maintenance",
      ],
      default: "optimal",
    },

    customsAvailable: {
      type: Boolean,
      default: true,
    },

    activeVesselsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeContainersCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dailyThroughput: {
      type: Number,
      default: 0,
      min: 0,
    },

    yearlyCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Security & Risk
    securityLevel: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      default: "moderate",
    },

    weatherRisk: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    // Contact
    contact: {
      email: String,
      phone: String,
      website: String,
    },

    // Media
    image: {
      type: String,
      default: "",
    },

    logo: {
      type: String,
      default: "",
    },

    // Logistics Network
    connectedHarbors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Harbor",
      },
    ],

    supportedTransportModes: [
      {
        type: String,
        enum: [
          "sea",
          "road",
          "rail",
          "air",
        ],
      },
    ],

    // Analytics
    totalShipmentsProcessed: {
      type: Number,
      default: 0,
    },

    totalRevenueGenerated: {
      type: Number,
      default: 0,
    },

    // System
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial Search
harborSchema.index({ coordinates: "2dsphere" });

// Fast Filtering
harborSchema.index({
  country: 1,
  city: 1,
});

harborSchema.index({
  operationalStatus: 1,
  capacityStatus: 1,
});

harborSchema.index({
  harborType: 1,
  continent: 1,
});

export default mongoose.model("Harbor", harborSchema);