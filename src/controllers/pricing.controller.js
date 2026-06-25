const PricingService = require("../services/pricing.service");

/**
 * Get Shipping Cost Estimate
 * Supports Air, Sea and Road Freight
 */
exports.getEstimate = async (req, res, next) => {
  try {
    const {
      mode,
      cargoType,
      weight,
      dimensions,
      declaredValue = 0,
      origin,
      destination,
    } = req.body;

    // Validation
    if (!mode) {
      return res.status(400).json({
        status: "fail",
        message: "Shipping mode is required.",
      });
    }

    if (!["air", "sea", "road"].includes(mode)) {
      return res.status(400).json({
        status: "fail",
        message: "Mode must be air, sea or road.",
      });
    }

    if (!cargoType) {
      return res.status(400).json({
        status: "fail",
        message: "Cargo type is required.",
      });
    }

    if (!weight || Number(weight) <= 0) {
      return res.status(400).json({
        status: "fail",
        message: "Weight must be greater than zero.",
      });
    }

    // Calculate shipping estimate
    const estimate = await PricingService.calculatePrice({
      mode,
      cargoType,
      weight: Number(weight),
      dimensions,
      declaredValue: Number(declaredValue),
      origin,
      destination,
    });

    // Frontend animation metadata
    const renderMeta = {
      modelKey:
        mode === "sea"
          ? "cargo_ship"
          : mode === "air"
          ? "cargo_aircraft"
          : "delivery_truck",

      animation:
        mode === "sea"
          ? "ocean_cruise"
          : mode === "air"
          ? "takeoff"
          : "road_delivery",

      cargoClass:
        Number(weight) > 1000
          ? "heavy"
          : Number(weight) > 250
          ? "medium"
          : "light",

      estimatedVisualLoad:
        Number(weight) > 1000 ? "high" : "normal",
    };

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),

      data: {
        estimate,
        renderMeta,

        shipment: {
          mode,
          cargoType,
          weight: Number(weight),
          declaredValue: Number(declaredValue),
          origin,
          destination,
        },
      },
    });
  } catch (error) {
    console.error("Pricing Estimate Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to calculate shipping estimate.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};