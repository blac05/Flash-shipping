const Shipment = require("../models/Shipment");
const documentService = require("../services/document.service");
const { generateTrackingCode } = require("../utils/trackingGenerator");
const twilioConfig = require("../config/twilio");

/**
 * Create Shipment
 */
exports.createShipment = async (req, res, next) => {
  try {
    const {
      mode,
      type,
      cargoType,
      weight,
      dimensions,
      origin,
      destination,
      declaredValue = 0,
      pricing,
    } = req.body;

    // Validation
    if (!mode || !cargoType || !weight || !origin || !destination) {
      return res.status(400).json({
        status: "fail",
        message:
          "Mode, cargo type, weight, origin and destination are required.",
      });
    }

    const trackingCode = generateTrackingCode();

    const shipment = await Shipment.create({
      trackingCode,
      userId: req.user._id,

      mode,
      type,
      cargoType,

      weight,
      dimensions,

      origin,
      destination,

      declaredValue,
      pricing,

      status: "pending",

      timeline: [
        {
          status: "pending",
          location: origin.city || origin.address,
          timestamp: new Date(),
          note: "Shipment created",
        },
      ],
    });

    // Generate shipping documents asynchronously
    setImmediate(async () => {
      try {
        await documentService.generateBillOfLading(
          shipment,
          req.user
        );
      } catch (error) {
        console.error(
          "Document Generation Error:",
          error.message
        );
      }
    });

    res.status(201).json({
      status: "success",
      message: "Shipment created successfully.",
      data: {
        shipment,
        trackingCode,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Confirm Delivery
 * Triggered after customer slides to confirm delivery
 */
exports.confirmDeliverySlider = async (req, res, next) => {
  try {
    const {
      shipmentId,
      ratingScore,
      ratingComment,
    } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        status: "fail",
        message: "Shipment not found.",
      });
    }

    if (shipment.deliveryConfirmed) {
      return res.status(400).json({
        status: "fail",
        message:
          "Delivery has already been confirmed.",
      });
    }

    shipment.status = "delivered";
    shipment.deliveryConfirmed = true;
    shipment.actualDeliveredAt = new Date();

    shipment.rating = {
      score: ratingScore || 5,
      comment: ratingComment || "",
      ratedAt: new Date(),
    };

    shipment.timeline.push({
      status: "delivered",
      location:
        shipment.destination?.city ||
        shipment.destination?.address,
      timestamp: new Date(),
      note: "Customer confirmed delivery",
    });

    await shipment.save();

    /**
     * Optional voice notification
     */
    if (
      twilioConfig?.client &&
      req.user?.phone
    ) {
      try {
        await twilioConfig.client.calls.create({
          twiml: `
            <Response>
              <Say voice="alice">
                Your shipment has been successfully delivered.
                Thank you for choosing Flash Shipping.
              </Say>
            </Response>
          `,
          to: req.user.phone,
          from: twilioConfig.phone,
        });
      } catch (twilioError) {
        console.error(
          "Twilio Call Error:",
          twilioError.message
        );
      }
    }

    res.status(200).json({
      status: "success",
      message:
        "Delivery confirmed successfully.",
      data: {
        shipmentId: shipment._id,
        trackingCode: shipment.trackingCode,
        status: shipment.status,
        deliveredAt:
          shipment.actualDeliveredAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Track Shipment
 */
exports.trackShipment = async (req, res, next) => {
  try {
    const { trackingCode } = req.params;

    const shipment = await Shipment.findOne({
      trackingCode,
    })
      .populate(
        "userId",
        "fullName email phone"
      )
      .lean();

    if (!shipment) {
      return res.status(404).json({
        status: "fail",
        message:
          "Tracking code not found.",
      });
    }

    res.status(200).json({
      status: "success",
      data: shipment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get User Shipments
 */
exports.getMyShipments = async (
  req,
  res,
  next
) => {
  try {
    const shipments =
      await Shipment.find({
        userId: req.user._id,
      })
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
      status: "success",
      results: shipments.length,
      data: shipments,
    });
  } catch (err) {
    next(err);
  }
};