const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const User = require("../models/User");

const signAccessToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

exports.register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      accountType,
      companyName,
      taxId,
      gpsAddress,
      lat,
      lng,
    } = req.body;

    // ─────────────────────────────────────
    // Validation
    // ─────────────────────────────────────

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const emailClean = email.toLowerCase().trim();

    if (!validator.isEmail(emailClean)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    // ─────────────────────────────────────
    // Duplicate Checks
    // ─────────────────────────────────────

    const existingEmail = await User.findOne({
      email: emailClean,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "An account already exists with this email.",
      });
    }

    const existingPhone = await User.findOne({
      phone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "Phone number already registered.",
      });
    }

    // ─────────────────────────────────────
    // Business Validation
    // ─────────────────────────────────────

    if (
      accountType === "business" &&
      (!companyName || !taxId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Company name and tax ID are required for business accounts.",
      });
    }

    // ─────────────────────────────────────
    // Password Hashing
    // ─────────────────────────────────────

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    // ─────────────────────────────────────
    // GeoJSON Location
    // ─────────────────────────────────────

    const longitude =
      Number(lng) || 0;

    const latitude =
      Number(lat) || 0;

    // ─────────────────────────────────────
    // Create User
    // ─────────────────────────────────────

    const user = await User.create({
      fullName,

      email: emailClean,

      phone,

      passwordHash,

      accountType:
        accountType || "personal",

      companyName,

      taxId,

      gpsAddress,

      emailVerified: false,

      coordinates: {
        type: "Point",
        coordinates: [
          longitude,
          latitude,
        ],
      },

      lastLoginAt: new Date(),

      registrationSource:
        req.get("origin") || "web",
    });

    // ─────────────────────────────────────
    // JWT
    // ─────────────────────────────────────

    const accessToken =
      signAccessToken(user._id);

    // ─────────────────────────────────────
    // Response
    // ─────────────────────────────────────

    res.status(201).json({
      success: true,

      token: accessToken,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountType:
          user.accountType,
        companyName:
          user.companyName,
        emailVerified:
          user.emailVerified,
        createdAt:
          user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};